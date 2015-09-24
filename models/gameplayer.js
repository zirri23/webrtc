module.exports = function(sequelize, DataTypes) {
  var GamePlayer = sequelize.define("GamePlayer", {
    uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV1,
      unique: true
    },
    name : DataTypes.STRING
  });
  return GamePlayer;
};