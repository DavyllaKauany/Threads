const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Save = sequelize.define("Save", {
  UserId: { type: DataTypes.INTEGER, allowNull: false },
  PostId: { type: DataTypes.INTEGER, allowNull: false }
}, {
  indexes: [{ unique: true, fields: ["UserId", "PostId"] }]
});

module.exports = Save;
