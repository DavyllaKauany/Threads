# Threads (Express + Sequelize + SQLite)

## Como rodar

1. Instale o Node.js (versão 18 ou mais nova): https://nodejs.org
2. Descompacte o ZIP, abra o terminal dentro da pasta `threads` e rode:

```
npm install
npm start
```

3. Abra http://localhost:3000

O arquivo `database.sqlite` é criado sozinho na primeira vez, já com usuários e posts de exemplo.
Para recomeçar do zero, feche o servidor e apague o `database.sqlite`.

## Contas de exemplo (senha: 123456)

ayslla, mariaclara, isaac, myllena, gizelly

Também dá para criar uma conta nova na tela de login.
Dica de teste: entre como `mariaclara`, curta e comente um post da `ayslla`, saia, entre como `ayslla` e veja a notificação em **Atividade**.

## Estrutura

```
threads/
├── app.js                 servidor, sessão, rotas e dados de exemplo
├── package.json
├── config/database.js     conexão Sequelize com o SQLite
├── models/                User, Post, Like, Follow, Save, Comment, Message, Activity
│   └── index.js           relações entre as tabelas
├── routes/
│   ├── auth.js            cadastro, login, logout
│   ├── usuarios.js        perfil, seguir, editar bio, listar
│   ├── posts.js           feed, filtros, curtir, salvar, comentar, arquivar, apagar
│   ├── mensagens.js       conversas
│   └── atividades.js      notificações e insights
└── public/
    ├── index.html  login.html  perfil.html
    ├── script.js   style.css
```

## O que cada tela faz

- **Início**: publicar (com opção de post temporário de 24h), curtir, comentar, salvar, arquivar e apagar
- **Seguindo**: posts de quem você segue
- **Pesquisar**: busca pessoas e posts
- **Atividade**: notificações de curtidas, comentários e novos seguidores
- **Mensagens**: conversas entre usuários
- **Salvos, Curtidas, Temporários, Arquivados**: filtros dos seus posts
- **Insights**: contagens feitas no banco
- **Perfil**: seguidores, seguindo, posts, botão Seguir e editar bio
