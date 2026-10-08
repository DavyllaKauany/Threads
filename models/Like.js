const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Like = sequelize.define("Like", {
  UserId: { type: DataTypes.INTEGER, allowNull: false },
  PostId: { type: DataTypes.INTEGER, allowNull: false }
}, {
  indexes: [{ unique: true, fields: ["UserId", "PostId"] }] // ninguém curte duas vezes
});

module.exports = Like;
