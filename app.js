const express = require("express");
const session = require("express-session");
const path = require("path");
const bcrypt = require("bcryptjs");
const { sequelize, User, Post, Like, Follow, Comment, Message, Activity } = require("./models");

const app = express();
const PORT = process.env.PORT || 3000;

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

// Arquivos da pasta public (index: false porque a rota "/" decide para onde ir)
app.use(express.static(path.join(__dirname, "public"), { index: false }));

app.get("/", (req, res) => {
  if (!req.session.userId) return res.redirect("/login.html");
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Rotas da API
app.use("/api/auth", require("./routes/auth"));
app.use("/api/usuarios", exigirLogin, require("./routes/usuarios"));
app.use("/api/posts", exigirLogin, require("./routes/posts"));
app.use("/api/mensagens", exigirLogin, require("./routes/mensagens"));
app.use("/api/atividades", exigirLogin, require("./routes/atividades"));

// Dados de exemplo (só na primeira vez que o banco é criado). Senha de todos: 123456
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

// Cria as tabelas (se não existirem), insere os exemplos e liga o servidor
sequelize.sync()
  .then(criarDadosDeExemplo)
  .then(() => {
    app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error("Erro ao iniciar:", err);
    process.exit(1);
  });
