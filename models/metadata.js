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