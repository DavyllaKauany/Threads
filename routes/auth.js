const express = require("express");
const bcrypt = require("bcryptjs");
const { User } = require("../models");

const router = express.Router();

// POST /api/auth/registrar
router.post("/registrar", async (req, res) => {
  try {
    const usuario = String(req.body.usuario || "").trim().toLowerCase();
    const nome = String(req.body.nome || "").trim();
    const senha = String(req.body.senha || "");

    if (!/^[a-z0-9_.]{3,20}$/.test(usuario)) {
      return res.status(400).json({ erro: "Usuário: 3 a 20 caracteres (letras, números, _ ou .)." });
    }
    if (!nome) return res.status(400).json({ erro: "Informe seu nome." });
    if (senha.length < 4) return res.status(400).json({ erro: "A senha precisa ter pelo menos 4 caracteres." });

    if (await User.findOne({ where: { usuario } })) {
      return res.status(409).json({ erro: "Esse usuário já existe." });
    }

    const novo = await User.create({ usuario, nome, senha: await bcrypt.hash(senha, 10) });
    req.session.userId = novo.id;
    res.json({ id: novo.id, usuario: novo.usuario, nome: novo.nome });
  } catch (e) {
    res.status(500).json({ erro: "Erro ao cadastrar." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const usuario = String(req.body.usuario || "").trim().toLowerCase();
    const senha = String(req.body.senha || "");

    const user = await User.findOne({ where: { usuario } });
    if (!user || !(await bcrypt.compare(senha, user.senha))) {
      return res.status(401).json({ erro: "Usuário ou senha incorretos." });
    }

    req.session.userId = user.id;
    res.json({ id: user.id, usuario: user.usuario, nome: user.nome });
  } catch (e) {
    res.status(500).json({ erro: "Erro ao entrar." });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// GET /api/auth/eu  (quem está logado)
router.get("/eu", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ erro: "Não autenticado." });
  const user = await User.findByPk(req.session.userId, { attributes: ["id", "usuario", "nome", "bio"] });
  if (!user) return res.status(401).json({ erro: "Não autenticado." });
  res.json(user);
});

module.exports = router;
