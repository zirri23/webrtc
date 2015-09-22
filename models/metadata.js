var JsonField = require('sequelize-json');

module.exports = function(sequelize, DataTypes) {
  var Metadata = sequelize.define("Metadata", {
    entity : DataTypes.STRING,
    entityId: DataTypes.INTEGER.UNSIGNED,
    key : DataTypes.STRING,
    value : JsonField(sequelize, 'Metadata', 'value'),
    tag : DataTypes.STRING
  }, {
    classMethods: {
      associate : function(models) {
        Metadata.belongsTo(models.Game, {
          foreignKey: 'entityId',
          constraints: false,
          as: "game"
        });
        Metadata.belongsTo(models.Player, {
          foreignKey: 'entityId',
          constraints: false,
          as: "player"
        });
        Metadata.belongsTo(models.GamePlayer, {
          foreignKey: 'entityId',
          constraints: false,
          as: "gamePlayer"
        });
        Metadata.belongsTo(models.Play, {
          foreignKey: 'entityId',
          constraints: false,
          as: "play"
        });
      }
    },
    instanceMethods: {
      getItem: function() {
        return this[
            'get' + this.get('entity').substr(0, 1).toUpperCase() +
            this.get('entity').substr(1)]();
      }
    }
  });
  return Metadata;
};