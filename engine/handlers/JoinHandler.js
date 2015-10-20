var cards = require('../cards');

exports.JoinHandler = function(models) {
  this.handlePlay = function(play, game, gamePlayer, gamePlayerMapById, playMetadata, callback) {
    var handsMetadata = {};
    var winStacksMetadata = {};
    handsMetadata[game.session] = {};
    winStacksMetadata[game.session] = [];
    
    gamePlayer.status = (game.status === "dealt" ? 'observer' : 'active');
    gamePlayer.save();
    gamePlayer.setMetadata([
      {key: 'hands', value: handsMetadata, system: true},
      {key: 'score', value: 0},
      {key: 'won', value: 0},
      {key: 'winStacks', value: winStacksMetadata}], callback);
  };
};