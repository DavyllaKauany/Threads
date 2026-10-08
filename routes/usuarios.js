const express = require("express");
const { Op } = require("sequelize");
const { User, Follow, Activity } = require("../models");

// Endpoints de busca de pessoas, edição de perfil e relação de seguidores.
const router = express.Router();

// GET /api/usuarios?q=texto  (lista de usuários, com busca opcional)
router.get("/", async (req, res) => {
  // Sem q, lista todos; com q, procura por nome ou nome de usuário.
  const q = String(req.query.q || "").trim();
  const where = q
    ? { [Op.or]: [{ usuario: { [Op.like]: `%${q}%` } }, { nome: { [Op.like]: `%${q}%` } }] }
    : {};
  const lista = await User.findAll({ where, attributes: ["id", "usuario", "nome", "bio"], order: [["nome", "ASC"]] });
  res.json(lista);
});

// PUT /api/usuarios/eu  (editar nome e bio)
router.put("/eu", async (req, res) => {
  // Atualiza apenas o perfil da sessão atual e limita a bio a 150 caracteres.
  const user = await User.findByPk(req.session.userId);
  const nome = String(req.body.nome ?? user.nome).trim();
  const bio = String(req.body.bio ?? user.bio).trim().slice(0, 150);
  if (!nome) return res.status(400).json({ erro: "O nome não pode ficar vazio." });
  await user.update({ nome, bio });
  res.json({ usuario: user.usuario, nome: user.nome, bio: user.bio });
});

// GET /api/usuarios/:usuario  (perfil)
router.get("/:usuario", async (req, res) => {
  const user = await User.findOne({ where: { usuario: req.params.usuario.toLowerCase() } });
  if (!user) return res.status(404).json({ erro: "Usuário não encontrado." });

  const meId = req.session.userId;
  // As contagens e o vínculo atual são consultados em paralelo para o perfil.
  const [seguidores, seguindo, euSigo] = await Promise.all([
    Follow.count({ where: { seguidoId: user.id } }),
    Follow.count({ where: { seguidorId: user.id } }),
    Follow.findOne({ where: { seguidorId: meId, seguidoId: user.id } })
  ]);

  res.json({
    id: user.id,
    usuario: user.usuario,
    nome: user.nome,
    bio: user.bio,
    seguidores,
    seguindo,
    euSigo: !!euSigo,
    souEu: user.id === meId
  });
});

// POST /api/usuarios/:usuario/seguir  (seguir / deixar de seguir)
router.post("/:usuario/seguir", async (req, res) => {
  const alvo = await User.findOne({ where: { usuario: req.params.usuario.toLowerCase() } });
  if (!alvo) return res.status(404).json({ erro: "Usuário não encontrado." });

  const meId = req.session.userId;
  if (alvo.id === meId) return res.status(400).json({ erro: "Você não pode seguir a si mesmo." });

  // A rota alterna o estado: remove o vínculo se já existir, caso contrário cria-o.
  const existente = await Follow.findOne({ where: { seguidorId: meId, seguidoId: alvo.id } });
  if (existente) {
    await existente.destroy();
  } else {
    await Follow.create({ seguidorId: meId, seguidoId: alvo.id });
    await Activity.create({ tipo: "seguiu", texto: "começou a seguir você.", deId: meId, paraId: alvo.id });
  }

  const seguidores = await Follow.count({ where: { seguidoId: alvo.id } });
  res.json({ euSigo: !existente, seguidores });
});

module.exports = router;
