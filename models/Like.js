const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Registra a curtida de uma pessoa em um post.
const Like = sequelize.define("Like", {
  UserId: { type: DataTypes.INTEGER, allowNull: false },
  PostId: { type: DataTypes.INTEGER, allowNull: false }
}, {
  // Impede curtidas duplicadas para a mesma combinação de usuário e post.
  indexes: [{ unique: true, fields: ["UserId", "PostId"] }]
});

module.exports = Like;
