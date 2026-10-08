const express = require("express");
const { Op } = require("sequelize");
const { User, Post, Like, Follow, Save, Comment, Activity } = require("../models");

const router = express.Router();
const LIMITE = 500;

// ---------- funções auxiliares ----------

// Condição reutilizada nas consultas para ocultar posts temporários vencidos.
const naoExpirado = () => ({
  [Op.or]: [{ expiraEm: null }, { expiraEm: { [Op.gt]: new Date() } }]
});

// Converte registros e relações do banco para o formato simples consumido pela interface.
// Também calcula as contagens e o estado de curtida/salvamento do usuário atual.
async function montar(posts, meId) {
  if (posts.length === 0) return [];
  const ids = posts.map(p => p.id);

  const [curtidas, comentarios, salvos] = await Promise.all([
    Like.findAll({ where: { PostId: ids } }),
    Comment.findAll({ where: { PostId: ids } }),
    Save.findAll({ where: { PostId: ids, UserId: meId } })
  ]);

  return posts.map(p => ({
    id: p.id,
    texto: p.texto,
    createdAt: p.createdAt,
    expiraEm: p.expiraEm,
    arquivado: p.arquivado,
    autor: { usuario: p.User.usuario, nome: p.User.nome },
    meu: p.UserId === meId,
    curtidas: curtidas.filter(c => c.PostId === p.id).length,
    curtido: curtidas.some(c => c.PostId === p.id && c.UserId === meId),
    comentarios: comentarios.filter(c => c.PostId === p.id).length,
    salvo: salvos.some(s => s.PostId === p.id)
  }));
}

const incluirAutor = [{ model: User, attributes: ["usuario", "nome"] }];

// ---------- rotas ----------

// GET /api/posts?filtro=...&q=...&autor=...
// Combina filtros, pesquisa textual e perfil do autor em uma única consulta.
router.get("/", async (req, res) => {
  try {
    const meId = req.session.userId;
    const { filtro = "paraVoce", q, autor } = req.query;
    const condicoes = [];

    // Arquivados são consultados separadamente; os demais filtros não mostram arquivados
    // nem posts temporários cujo prazo já terminou.
    if (filtro === "arquivados") {
      condicoes.push({ UserId: meId, arquivado: true });
    } else {
      condicoes.push({ arquivado: false });
      condicoes.push(naoExpirado());
    }

    if (filtro === "seguindo") {
      const seguidos = await Follow.findAll({ where: { seguidorId: meId } });
      condicoes.push({ UserId: seguidos.map(f => f.seguidoId) });
    }
    if (filtro === "salvos") {
      const salvos = await Save.findAll({ where: { UserId: meId } });
      condicoes.push({ id: salvos.map(s => s.PostId) });
    }
    if (filtro === "curtidas") {
      const curtidas = await Like.findAll({ where: { UserId: meId } });
      condicoes.push({ id: curtidas.map(c => c.PostId) });
    }
    if (filtro === "temporarios") {
      condicoes.push({ UserId: meId, expiraEm: { [Op.not]: null } });
    }
    if (autor) {
      const dono = await User.findOne({ where: { usuario: String(autor).toLowerCase() } });
      condicoes.push({ UserId: dono ? dono.id : -1 });
    }
    if (q && String(q).trim()) {
      condicoes.push({ texto: { [Op.like]: `%${String(q).trim()}%` } });
    }

    // Limita os resultados e ordena o feed dos mais recentes para os mais antigos.
    const posts = await Post.findAll({
      where: { [Op.and]: condicoes },
      include: incluirAutor,
      order: [["createdAt", "DESC"]],
      limit: 100
    });
    res.json(await montar(posts, meId));
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro ao carregar os posts." });
  }
});

// POST /api/posts  { texto, temporario }
router.post("/", async (req, res) => {
  const texto = String(req.body.texto || "").trim();
  if (!texto) return res.status(400).json({ erro: "Escreva alguma coisa." });
  if (texto.length > LIMITE) return res.status(400).json({ erro: `Máximo de ${LIMITE} caracteres.` });

  // Posts temporários recebem uma data de expiração 24 horas após a publicação.
  const expiraEm = req.body.temporario ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;
  const post = await Post.create({ texto, expiraEm, UserId: req.session.userId });
  res.status(201).json({ id: post.id });
});

// POST /api/posts/:id/curtir  (curtir / descurtir)
router.post("/:id/curtir", async (req, res) => {
  const post = await Post.findByPk(req.params.id);
  if (!post) return res.status(404).json({ erro: "Post não encontrado." });

  const meId = req.session.userId;
  // Alterna a curtida e notifica o autor somente quando outra pessoa curte.
  const existente = await Like.findOne({ where: { UserId: meId, PostId: post.id } });
  if (existente) {
    await existente.destroy();
  } else {
    await Like.create({ UserId: meId, PostId: post.id });
    if (post.UserId !== meId) {
      await Activity.create({ tipo: "curtiu", texto: "curtiu seu post.", deId: meId, paraId: post.UserId, PostId: post.id });
    }
  }
  res.json({ curtido: !existente, curtidas: await Like.count({ where: { PostId: post.id } }) });
});

// POST /api/posts/:id/salvar  (salvar / remover dos salvos)
router.post("/:id/salvar", async (req, res) => {
  const post = await Post.findByPk(req.params.id);
  if (!post) return res.status(404).json({ erro: "Post não encontrado." });

  const meId = req.session.userId;
  // Salvar também funciona como alternância: um segundo clique remove o registro.
  const existente = await Save.findOne({ where: { UserId: meId, PostId: post.id } });
  if (existente) await existente.destroy();
  else await Save.create({ UserId: meId, PostId: post.id });
  res.json({ salvo: !existente });
});

// POST /api/posts/:id/arquivar  (arquivar / desarquivar — só o dono)
router.post("/:id/arquivar", async (req, res) => {
  const post = await Post.findByPk(req.params.id);
  if (!post) return res.status(404).json({ erro: "Post não encontrado." });
  if (post.UserId !== req.session.userId) return res.status(403).json({ erro: "Esse post não é seu." });

  // Arquivar não apaga o conteúdo; apenas alterna sua visibilidade nos filtros.
  await post.update({ arquivado: !post.arquivado });
  res.json({ arquivado: post.arquivado });
});

// DELETE /api/posts/:id  (só o dono)
router.delete("/:id", async (req, res) => {
  const post = await Post.findByPk(req.params.id);
  if (!post) return res.status(404).json({ erro: "Post não encontrado." });
  if (post.UserId !== req.session.userId) return res.status(403).json({ erro: "Esse post não é seu." });

  // Remove dados relacionados explicitamente antes do post para não deixar órfãos.
  await Like.destroy({ where: { PostId: post.id } });
  await Save.destroy({ where: { PostId: post.id } });
  await Comment.destroy({ where: { PostId: post.id } });
  await Activity.destroy({ where: { PostId: post.id } });
  await post.destroy();
  res.json({ ok: true });
});

// GET /api/posts/:id/comentarios
router.get("/:id/comentarios", async (req, res) => {
  // Inclui o autor em cada comentário e apresenta o histórico em ordem cronológica.
  const comentarios = await Comment.findAll({
    where: { PostId: req.params.id },
    include: incluirAutor,
    order: [["createdAt", "ASC"]]
  });
  res.json(comentarios.map(c => ({
    id: c.id,
    texto: c.texto,
    createdAt: c.createdAt,
    autor: { usuario: c.User.usuario, nome: c.User.nome }
  })));
});

// POST /api/posts/:id/comentarios  { texto }
router.post("/:id/comentarios", async (req, res) => {
  const post = await Post.findByPk(req.params.id);
  if (!post) return res.status(404).json({ erro: "Post não encontrado." });

  const texto = String(req.body.texto || "").trim();
  if (!texto) return res.status(400).json({ erro: "Escreva um comentário." });
  if (texto.length > LIMITE) return res.status(400).json({ erro: `Máximo de ${LIMITE} caracteres.` });

  const meId = req.session.userId;
  // Guarda o comentário e cria notificação para o dono se foi escrito por outra pessoa.
  await Comment.create({ texto, UserId: meId, PostId: post.id });
  if (post.UserId !== meId) {
    await Activity.create({ tipo: "comentou", texto: "comentou no seu post.", deId: meId, paraId: post.UserId, PostId: post.id });
  }
  res.status(201).json({ comentarios: await Comment.count({ where: { PostId: post.id } }) });
});

module.exports = router;
