const express = require("express");
const { Op } = require("sequelize");
const { User, Message } = require("../models");

// Endpoints para listar conversas, abrir um histórico e enviar mensagens.
const router = express.Router();

// GET /api/mensagens/conversas  (última mensagem de cada conversa)
router.get("/conversas", async (req, res) => {
  const meId = req.session.userId;
  const mensagens = await Message.findAll({
    where: { [Op.or]: [{ deId: meId }, { paraId: meId }] },
    include: [
      { model: User, as: "de", attributes: ["id", "usuario", "nome"] },
      { model: User, as: "para", attributes: ["id", "usuario", "nome"] }
    ],
    order: [["createdAt", "DESC"], ["id", "DESC"]]
  });

  // Como a consulta vem da mais recente para a mais antiga, guarda a primeira por pessoa.
  const conversas = new Map();
  for (const m of mensagens) {
    const outro = m.deId === meId ? m.para : m.de;
    if (!conversas.has(outro.id)) {
      conversas.set(outro.id, {
        usuario: outro.usuario,
        nome: outro.nome,
        ultima: m.texto,
        minha: m.deId === meId,
        createdAt: m.createdAt
      });
    }
  }
  res.json([...conversas.values()]);
});

// GET /api/mensagens/:usuario  (conversa com uma pessoa)
router.get("/:usuario", async (req, res) => {
  const meId = req.session.userId;
  const outro = await User.findOne({ where: { usuario: req.params.usuario.toLowerCase() } });
  if (!outro) return res.status(404).json({ erro: "Usuário não encontrado." });

  // Busca as mensagens nos dois sentidos e devolve na ordem em que foram enviadas.
  const mensagens = await Message.findAll({
    where: {
      [Op.or]: [
        { deId: meId, paraId: outro.id },
        { deId: outro.id, paraId: meId }
      ]
    },
    order: [["createdAt", "ASC"], ["id", "ASC"]]
  });

  res.json({
    com: { usuario: outro.usuario, nome: outro.nome },
    mensagens: mensagens.map(m => ({ id: m.id, texto: m.texto, minha: m.deId === meId, createdAt: m.createdAt }))
  });
});

// POST /api/mensagens/:usuario  { texto }
router.post("/:usuario", async (req, res) => {
  const meId = req.session.userId;
  const outro = await User.findOne({ where: { usuario: req.params.usuario.toLowerCase() } });
  if (!outro) return res.status(404).json({ erro: "Usuário não encontrado." });
  if (outro.id === meId) return res.status(400).json({ erro: "Você não pode enviar mensagem para si mesmo." });

  const texto = String(req.body.texto || "").trim();
  if (!texto) return res.status(400).json({ erro: "Escreva uma mensagem." });

  await Message.create({ texto, deId: meId, paraId: outro.id });
  res.status(201).json({ ok: true });
});

module.exports = router;
