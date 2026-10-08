const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Relação entre a pessoa que segue e a pessoa seguida.
const Follow = sequelize.define("Follow", {
  seguidorId: { type: DataTypes.INTEGER, allowNull: false },
  seguidoId: { type: DataTypes.INTEGER, allowNull: false }
}, {
  // Evita registrar duas vezes o mesmo vínculo.
  indexes: [{ unique: true, fields: ["seguidorId", "seguidoId"] }]
});

module.exports = Follow;
