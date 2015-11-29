var cards = require("../cards");

exports.BasicBot = {
  handlePlay: function (game, botPlayer, models, t, callback) {
    models.Play.where({game_id: game.get("id")}).fetchAll({transacting: t}).then(function(plays) {
      console.log("There are " + plays.length + " plays");
      plays = plays.filter(function(play){return true}).sort(function(a, b) {
        return a.get("created_at") - b.get("created_at");
      });

      var lastPlay = plays[plays.length - 1];
      console.log("The last play was: " + JSON.stringify(lastPlay));
      if (lastPlay.getMetadata("type") == "ready") {
        console.log("Replying to a ready play");
        callback("", {play: "ready"});
      } else if (lastPlay.getMetadata("type") == "init") {
        if (game.getMetadata("turnGamePlayer") == botPlayer.get("uuid")) {
          console.log("Bot is dealer, dealing");
          callback("", {play: "deal", metadata: {}});
        } else {
          console.log("Bot is not dealer, not dealing");
          callback("", null);
        }
      } else if (lastPlay.getMetadata("type") == "drop") {
        console.log("Replying to a play play");
        if (game.getMetadata("turnGamePlayer") !== botPlayer.get("uuid")) {
          callback("", null);
        }
        var leadCard = cards.valueOf(game.getMetadata("leadCard"));

        var hand = botPlayer.getMetadata("hands")[game.getMetadata("session")];
        var cardToPlay = hand.find(function(card) {
          return card.play == "unplayed" && cards.valueOf(card.card).suit == leadCard.suit;
        });

        callback("", {play: "drop", metadata: {cards: [cardToPlay]}});
      } else {
        console.log("Could not reply to play: " + JSON.stringify(lastPlay));
        callback("", null);
      }
    });
  }
}