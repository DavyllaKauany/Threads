const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Dados públicos e credencial (senha armazenada como hash, nunca como texto puro).
const User = sequelize.define("User", {
  usuario: { type: DataTypes.STRING, allowNull: false, unique: true },
  nome: { type: DataTypes.STRING, allowNull: false },
  senha: { type: DataTypes.STRING, allowNull: false },
  bio: { type: DataTypes.STRING, defaultValue: "" }
});

module.exports = User;
