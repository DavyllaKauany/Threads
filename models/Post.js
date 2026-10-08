const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Post = sequelize.define("Post", {
  texto: { type: DataTypes.TEXT, allowNull: false },
  arquivado: { type: DataTypes.BOOLEAN, defaultValue: false },
  expiraEm: { type: DataTypes.DATE, allowNull: true } // preenchido só nos posts temporários
});

module.exports = Post;
