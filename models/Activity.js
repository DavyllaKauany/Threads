const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Activity = sequelize.define("Activity", {
  tipo: { type: DataTypes.STRING, allowNull: false },     // curtiu, comentou ou seguiu
  texto: { type: DataTypes.STRING, allowNull: false },
  deId: { type: DataTypes.INTEGER, allowNull: false },    // quem fez a ação
  paraId: { type: DataTypes.INTEGER, allowNull: false },  // quem recebe a notificação
  PostId: { type: DataTypes.INTEGER, allowNull: true }
});

module.exports = Activity;
