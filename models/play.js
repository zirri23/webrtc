module.exports = function(sequelize, DataTypes) {
  var Play = sequelize.define("Play", {
    uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV1,
      unique: true
    },
    type : {type: DataTypes.STRING, allowNull: false},
  }, {
    classMethods : {
      associate : function(models) {
        Play.belongsTo(models.Game);
        Play.belongsTo(models.Player);
        Play.belongsTo(models.GamePlayer);
        Play.hasMany(models.Metadata, {
          foreignKey: "entityId",
          constraints: false,
          scope: {entity: "Play"}
        });
      }
    }
  });
  return Play;
};