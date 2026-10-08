const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Comment = sequelize.define("Comment", {
  texto: { type: DataTypes.TEXT, allowNull: false },
  UserId: { type: DataTypes.INTEGER, allowNull: false },
  PostId: { type: DataTypes.INTEGER, allowNull: false }
});

module.exports = Comment;
