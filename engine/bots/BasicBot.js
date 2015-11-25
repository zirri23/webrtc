var cards = require("../cards");

exports.BasicBot = {
  handlePlay: function (game, botPlayer, models, t) {
    var plays = game.related("plays");
    var lastPlay = plays[play.length - 1];
    var leadCard = cards.valueOf(game.getMetadata("leadCard"));

    var hand = botPlayer.getMetadata("hand")[game.getMetadata("session")];
    var cardToPlay = hand.filter(function(card) {
      return card.play == "unplayed" && cards.value(card.card).suit == leadCard.suit;
    });

    return {cards: [cardToPlay.fileFormat()]};
  }
}