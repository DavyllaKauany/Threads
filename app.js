const express = require("express");
const session = require("express-session");
const path = require("path");
const bcrypt = require("bcryptjs");
const { sequelize, User, Post, Like, Follow, Comment, Message, Activity } = require("./models");

// Cria a aplicação Express e escolhe a porta (a hospedagem pode fornecer PORT).
const app = express();
const PORT = process.env.PORT || 3000;

// Converte requisições JSON e mantém o usuário autenticado em uma sessão.
app.use(express.json());
app.use(session({
  secret: "threads-ifrn-segredo",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } // 7 dias
}));

// Só deixa passar quem está logado
function exigirLogin(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ erro: "Faça login para continuar." });
  next();
}

// Publica HTML, CSS e JavaScript. A página inicial é controlada pela rota abaixo.
app.use(express.static(path.join(__dirname, "public"), { index: false }));

// Protege a página inicial: visitantes são direcionados à tela de login.
app.get("/", (req, res) => {
  if (!req.session.userId) return res.redirect("/login.html");
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Cada router agrupa endpoints por funcionalidade; somente auth tem rotas públicas.
app.use("/api/auth", require("./routes/auth"));
app.use("/api/usuarios", exigirLogin, require("./routes/usuarios"));
app.use("/api/posts", exigirLogin, require("./routes/posts"));
app.use("/api/mensagens", exigirLogin, require("./routes/mensagens"));
app.use("/api/atividades", exigirLogin, require("./routes/atividades"));

// Popula um banco novo para facilitar testes manuais. Não altera bancos já preenchidos.
async function criarDadosDeExemplo() {
  if ((await User.count()) > 0) return;

  const senha = await bcrypt.hash("123456", 10);

  // Tudo é criado um por um (create) para termos certeza dos ids no SQLite
  const ayslla = await User.create({ usuario: "ayslla", nome: "Ayslla Soares", bio: "Estudante • IFRN", senha });
  const maria = await User.create({ usuario: "mariaclara", nome: "Maria Clara", bio: "Café e boas conversas.", senha });
  const isaac = await User.create({ usuario: "isaac", nome: "Isaac", bio: "Fotografia e música.", senha });
  const myllena = await User.create({ usuario: "myllena", nome: "Myllena", bio: "Aqui compartilho meus dias.", senha });
  const gizelly = await User.create({ usuario: "gizelly", nome: "Gizelly", bio: "Nova por aqui!", senha });

  await Post.create({ texto: "Bom dia, pessoal!", UserId: maria.id });
  await Post.create({ texto: "Alguém aí já usou o Threads hoje?", UserId: isaac.id });
  await Post.create({ texto: "Quem vai pro IFRN amanhã?", UserId: myllena.id });
  const primeiro = await Post.create({ texto: "Meu primeiro thread!", UserId: ayslla.id });

  await Follow.create({ seguidorId: ayslla.id, seguidoId: maria.id });
  await Follow.create({ seguidorId: ayslla.id, seguidoId: isaac.id });
  await Follow.create({ seguidorId: gizelly.id, seguidoId: ayslla.id });

  await Like.create({ UserId: maria.id, PostId: primeiro.id });
  await Comment.create({ texto: "Parabéns pelo primeiro thread!", UserId: isaac.id, PostId: primeiro.id });

  await Message.create({ texto: "Oi! Tudo bem?", deId: maria.id, paraId: ayslla.id });
  await Message.create({ texto: "Você viu o post?", deId: isaac.id, paraId: ayslla.id });

  await Activity.create({ tipo: "curtiu", texto: "curtiu seu post.", deId: maria.id, paraId: ayslla.id, PostId: primeiro.id });
  await Activity.create({ tipo: "comentou", texto: "comentou no seu post.", deId: isaac.id, paraId: ayslla.id, PostId: primeiro.id });
  await Activity.create({ tipo: "seguiu", texto: "começou a seguir você.", deId: gizelly.id, paraId: ayslla.id });
}

// Garante as tabelas, prepara dados iniciais e só então começa a aceitar requisições.
sequelize.sync()
  .then(criarDadosDeExemplo)
  .then(() => {
    app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error("Erro ao iniciar:", err);
    process.exit(1);
  });
