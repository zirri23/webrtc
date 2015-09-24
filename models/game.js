module.exports = function(sequelize, DataTypes) {
  var Game = sequelize.define("Game", {
    uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV1,
      unique: true
    },
    name : DataTypes.STRING
  }, {
    classMethods : {
      associate : function(models) {
        Game.belongsToMany(models.Player, {through: models.GamePlayer});
        Game.belongsTo(models.Player, {as: "creator"});
        Game.hasMany(models.Metadata, {
          foreignKey: "entityId",
          constraints: false,
          scope: {entity: "Game"}
        });
      }
    }
  });
  return Game;
};