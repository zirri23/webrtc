var cards = require("../cards");

exports.JoinHandler = {
  handlePlay: function(play, game, gamePlayer, gamePlayerMapById, t, callback) {
    var handsMetadata = {};
    handsMetadata[game.getMetadata("session")] = {};

    gamePlayer.setAllMetadata({
      "status": (game.status === "dealt" ? "observer" : "active"),
      "hands": handsMetadata,
      "score": 0,
      "won": 0
    });
    gamePlayer.save(null, {transacting: t}).then(function(gamePlayer) {
      callback("", {});
    }).catch(function(err) {
      callback(err, {});
    });
  }
};