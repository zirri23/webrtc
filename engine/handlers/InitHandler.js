var cards = require("../cards");

exports.InitHandler = {
  handlePlay: function(play, game, gamePlayer, gamePlayerMapById, models, t, callback) {
    game.setAllMetadata({
      "deck": cards.getSparDeck(),
      "dealer": gamePlayer.get("uuid"),
      "turnGamePlayer": gamePlayer.get("uuid"),
      "leadGamePlayer": gamePlayer.get("uuid"),
      "session": 0,
      "status": "undealt"});
    game.save(null, {transacting: t}).then(function(game) {
      callback("", {});
    }).catch(function(err) {
      callback(err, {});
    });
  }
};