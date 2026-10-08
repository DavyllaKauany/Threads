const express = require("express");
const { User, Post, Like, Follow, Save, Comment, Message, Activity } = require("../models");

// Notificações recentes e resumo numérico das atividades da conta.
const router = express.Router();

// GET /api/atividades  (notificações de quem está logado)
router.get("/", async (req, res) => {
  const lista = await Activity.findAll({
    where: { paraId: req.session.userId },
    include: [{ model: User, as: "de", attributes: ["usuario", "nome"] }],
    order: [["createdAt", "DESC"], ["id", "DESC"]],
    limit: 100
  });
  res.json(lista.map(a => ({
    id: a.id,
    tipo: a.tipo,
    texto: a.texto,
    createdAt: a.createdAt,
    de: { usuario: a.de.usuario, nome: a.de.nome }
  })));
});

// GET /api/atividades/insights  (contagens feitas com COUNT no banco)
router.get("/insights", async (req, res) => {
  const meId = req.session.userId;
  // COUNT no banco calcula cada indicador sem carregar todas as linhas na aplicação.
  const [posts, curtidasRecebidas, comentariosRecebidos, seguidores, seguindo, salvos, mensagens] = await Promise.all([
    Post.count({ where: { UserId: meId } }),
    Like.count({ include: [{ model: Post, where: { UserId: meId }, required: true }] }),
    Comment.count({ include: [{ model: Post, where: { UserId: meId }, required: true }] }),
    Follow.count({ where: { seguidoId: meId } }),
    Follow.count({ where: { seguidorId: meId } }),
    Save.count({ where: { UserId: meId } }),
    Message.count({ where: { deId: meId } })
  ]);
  res.json({ posts, curtidasRecebidas, comentariosRecebidos, seguidores, seguindo, salvos, mensagens });
});

module.exports = router;
