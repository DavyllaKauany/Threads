const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Notificação que registra quem fez uma ação e para qual usuário ela é exibida.
const Activity = sequelize.define("Activity", {
  tipo: { type: DataTypes.STRING, allowNull: false },     // curtiu, comentou ou seguiu
  texto: { type: DataTypes.STRING, allowNull: false },
  deId: { type: DataTypes.INTEGER, allowNull: false },    // quem fez a ação
  paraId: { type: DataTypes.INTEGER, allowNull: false },  // quem recebe a notificação
  PostId: { type: DataTypes.INTEGER, allowNull: true }
});

module.exports = Activity;
