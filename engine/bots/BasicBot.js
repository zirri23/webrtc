var cards = require("../cards");

exports.BasicBot = {
  handlePlay: function (game, botPlayer, models, t, callback) {
    models.Play.where({game_id: game.get("id")}).fetchAll({transacting: t}).then(function(plays) {
      plays = plays.filter(function(play){return true}).sort(function(a, b) {
        return a.get("created_at") - b.get("created_at");
      });

      var lastPlay = plays[plays.length - 1];
      if (lastPlay.getMetadata("type") == "ready") {
        if (game.getMetadata("status") == "ready" && game.getMetadata("turnGamePlayer") == botPlayer.get("uuid")) {
          return processDrop();
        }
        if (botPlayer.getMetadata("status") == "ready") {
          return callback(null, null);
        }
        callback("", {play: "ready"});
      } else if (lastPlay.getMetadata("type") == "init") {
        if (game.getMetadata("turnGamePlayer") == botPlayer.get("uuid")) {
          callback("", {play: "deal", metadata: {}});
        } else {
          callback("", null);
        }
      } else if (lastPlay.getMetadata("type") == "drop") {
        return processDrop();
      } else {
        callback("", null);
      }
    });
    function processDrop() {
      if (game.getMetadata("status") !== "ready") {
        return callback("", null);
      }
      if (game.getMetadata("turnGamePlayer") !== botPlayer.get("uuid")) {
        return callback("", null);
      }
      var leadCard = cards.valueOf(game.getMetadata("leadCard"));
      var hand = botPlayer.getMetadata("hands")[game.getMetadata("session")];
      var cardToPlay = hand.find(function (card) {
        return card.play == "unplayed" && cards.valueOf(card.card).suit == leadCard.suit;
      });
      cardToPlay = cardToPlay || hand.find(function (card) {
            return card.play == "unplayed";
          });
      return callback("", {play: "drop", metadata: {cards: [cardToPlay.card]}});
    }
  }
}