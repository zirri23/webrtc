module.exports = function(sequelize, DataTypes) {
  var GamePlayer = sequelize.define("GamePlayer", {
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
        GamePlayer.hasMany(models.Play);
        GamePlayer.hasMany(models.Metadata, {
          foreignKey: "entityId",
          constraints: false,
          scope: {entity: "GamePlayer"}
        });
      }
    }
  });
  return GamePlayer;
};