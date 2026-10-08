const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Marca um post como salvo para que apareça na lista pessoal de salvos.
const Save = sequelize.define("Save", {
  UserId: { type: DataTypes.INTEGER, allowNull: false },
  PostId: { type: DataTypes.INTEGER, allowNull: false }
}, {
  // Garante um único registro salvo por usuário e post.
  indexes: [{ unique: true, fields: ["UserId", "PostId"] }]
});

module.exports = Save;
