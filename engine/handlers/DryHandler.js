var cards = require('../cards');

exports.DryHandler = {
  handlePlay : function(play, game, gamePlayer, gamePlayerMapById, playMetadata, t, callback) {
    if (gamePlayer.status != "active") {
      callback("Can only dry when cards have just been dealt", null);
      return;
    }
    gamePlayer.getMetadata(["hands"], function(err, gamePlayerMetadata) {
      var hand = gamePlayerMetadata.hands.value[game.session];
      var playedCards = [];
      for (var cardIndex = 0; cardIndex < playMetadata.cards.value.length; cardIndex++) {
        var dryCard = playMetadata.cards.value[cardIndex];
        if (hand[dryCard].modifier != "drop") {
          callback("Card already dried", {});
          return;
        } else if (cards.valueOf(dryCard).rank.value > 7) {
          callback("Can only dry a 6 or 7", {});
          return;
        }
        playedCards.push({
          card: play.type === "show-dry" ? dryCard : null,
          index: gamePlayerMetadata.hands.value[game.session][dryCard].index});
        hand[dryCard].modifier = play.type;
      }
      gamePlayerMetadata.hands.save();
      callback(null,  {
        playType: play.type,
        cards: playedCards,
      });
    }, /* retrieveDbObject */ true);
  }
};