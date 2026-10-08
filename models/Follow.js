const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Follow = sequelize.define("Follow", {
  seguidorId: { type: DataTypes.INTEGER, allowNull: false },
  seguidoId: { type: DataTypes.INTEGER, allowNull: false }
}, {
  indexes: [{ unique: true, fields: ["seguidorId", "seguidoId"] }]
});

module.exports = Follow;
