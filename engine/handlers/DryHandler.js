var cards = require('../cards');

exports.DryHandler = {
  handlePlay : function(play, game, gamePlayer, models, t, callback) {
    if (gamePlayer.getMetadata("status") != "active") {
      callback("Can only dry when cards have just been dealt", {});
      return;
    }
    var playMetadata = play.getAllMetadata();
    var gamePlayerMetadata = gamePlayer.getAllMetadata();
    var hand = gamePlayerMetadata["hands"][game.getMetadata("session")];

    var playedCards = [];
    playMetadata.cards.forEach(function(playCard) {
      var cardInHand = hand.find(function(card) {return playCard == card.card});
      if (cardInHand == null || cardInHand == undefined) {
        return callback("You don't have that card anymore!", {});
      }
      if (cardInHand.modifier !== "none") {
        return callback("Card already dried or played", {});
      } else if (cards.valueOf(playCard).rank.value > 7) {
        return callback("Can only dry a 6 or 7", {});
      }
      playedCards.push({
        card: playMetadata.type === "show-dry" ? playCard : null,
        index: hand.indexOf(cardInHand)});
      cardInHand.modifier = playMetadata.type;
    });

    gamePlayer.setAllMetadata(gamePlayerMetadata);
    gamePlayer.save(null, {transacting: t}).then(function(gamePlayer) {
      callback(null,  {
        playType: playMetadata.type,
        cards: playedCards,
      });
    });
  }
};