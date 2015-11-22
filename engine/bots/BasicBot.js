var cards = require("../cards");

exports.BasicBot = {
  handlePlay: function (game, models, t, callback) {
    var plays = game.related("plays");
    var lastPlay = plays[play.length - 1];
    var leadCard = cards.valueOf(game.getMetadata("leadCard"));
  }
}