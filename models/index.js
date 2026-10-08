const sequelize = require("../config/database");
const User = require("./User");
const Post = require("./Post");
const Like = require("./Like");
const Follow = require("./Follow");
const Save = require("./Save");
const Comment = require("./Comment");
const Message = require("./Message");
const Activity = require("./Activity");

// Um usuário tem vários posts
User.hasMany(Post, { foreignKey: "UserId" });
Post.belongsTo(User, { foreignKey: "UserId" });

// Curtidas, salvos e comentários ligam usuário e post
Post.hasMany(Like, { foreignKey: "PostId" });
Like.belongsTo(Post, { foreignKey: "PostId" });
Like.belongsTo(User, { foreignKey: "UserId" });

Post.hasMany(Save, { foreignKey: "PostId" });
Save.belongsTo(Post, { foreignKey: "PostId" });

Post.hasMany(Comment, { foreignKey: "PostId" });
Comment.belongsTo(Post, { foreignKey: "PostId" });
Comment.belongsTo(User, { foreignKey: "UserId" });

// Seguidores
Follow.belongsTo(User, { as: "seguidor", foreignKey: "seguidorId" });
Follow.belongsTo(User, { as: "seguido", foreignKey: "seguidoId" });

// Mensagens e atividades têm dois usuários (de e para)
Message.belongsTo(User, { as: "de", foreignKey: "deId" });
Message.belongsTo(User, { as: "para", foreignKey: "paraId" });
Activity.belongsTo(User, { as: "de", foreignKey: "deId" });
Activity.belongsTo(User, { as: "para", foreignKey: "paraId" });

module.exports = { sequelize, User, Post, Like, Follow, Save, Comment, Message, Activity };
