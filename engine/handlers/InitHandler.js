var cards = require('../cards');

exports.InitHandler = function(models) {
  this.handlePlay = function(play, game, gamePlayer, gamePlayerMapById, playMetadata, callback) {
    game.setMetadata([
      {key: 'deck', value: cards.getSparDeck(), system: true},
      {key: 'dealer', value: gamePlayer.pk},
      {key: 'turnGamePlayer', value: gamePlayer.pk},
      {key: 'leadGamePlayer', value: gamePlayer.pk},
      {key: 'leadCard', value: null},
      {key: 'cardsLeftToPlay', value: null}], function(err, result) {
        game.session = 0;
        game.status = "undealt";
        game.save();
        callback(err, result);
      });
  };
};