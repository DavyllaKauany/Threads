const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Mensagem direta entre dois usuários; createdAt define sua posição na conversa.
const Message = sequelize.define("Message", {
  texto: { type: DataTypes.TEXT, allowNull: false },
  deId: { type: DataTypes.INTEGER, allowNull: false },   // quem enviou
  paraId: { type: DataTypes.INTEGER, allowNull: false }  // quem recebeu
});

module.exports = Message;
