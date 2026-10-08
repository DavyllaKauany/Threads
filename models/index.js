const sequelize = require("../config/database");
const User = require("./User");
const Post = require("./Post");
const Like = require("./Like");
const Follow = require("./Follow");
const Save = require("./Save");
const Comment = require("./Comment");
const Message = require("./Message");
const Activity = require("./Activity");

// Este arquivo reúne os modelos e define como as tabelas se relacionam.

// Um usuário pode publicar vários posts; cada post pertence a um autor.
User.hasMany(Post, { foreignKey: "UserId" });
Post.belongsTo(User, { foreignKey: "UserId" });

// Curtidas, itens salvos e comentários conectam pessoas aos posts.
Post.hasMany(Like, { foreignKey: "PostId" });
Like.belongsTo(Post, { foreignKey: "PostId" });
Like.belongsTo(User, { foreignKey: "UserId" });

Post.hasMany(Save, { foreignKey: "PostId" });
Save.belongsTo(Post, { foreignKey: "PostId" });

Post.hasMany(Comment, { foreignKey: "PostId" });
Comment.belongsTo(Post, { foreignKey: "PostId" });
Comment.belongsTo(User, { foreignKey: "UserId" });

// Uma relação de seguir tem dois usuários, identificados pelos nomes de associação.
Follow.belongsTo(User, { as: "seguidor", foreignKey: "seguidorId" });
Follow.belongsTo(User, { as: "seguido", foreignKey: "seguidoId" });

// Mensagens e notificações também referenciam usuários distintos de origem e destino.
Message.belongsTo(User, { as: "de", foreignKey: "deId" });
Message.belongsTo(User, { as: "para", foreignKey: "paraId" });
Activity.belongsTo(User, { as: "de", foreignKey: "deId" });
Activity.belongsTo(User, { as: "para", foreignKey: "paraId" });

module.exports = { sequelize, User, Post, Like, Follow, Save, Comment, Message, Activity };
