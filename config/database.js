const { Sequelize } = require("sequelize");
const path = require("path");

// Compartilha uma conexão Sequelize com um arquivo SQLite na raiz do projeto.
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "..", "database.sqlite"),
  logging: false
});

module.exports = sequelize;
