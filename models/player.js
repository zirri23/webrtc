module.exports = function(sequelize, DataTypes) {
  var Player = sequelize.define("Player", {
    uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV1,
      unique: true
    },
    name : DataTypes.STRING,
    remoteId : {
      type: DataTypes.STRING,
      unique: true
    },
    online : {
      type: DataTypes.BOOLEAN,
      defaultValue : false,
      allowNull: false
    }
  }, {
    classMethods : {
      associate : function(models) {
        Player.belongsToMany(models.Game, {through: models.GamePlayer});
      }
    }
  });
  return Player;
};