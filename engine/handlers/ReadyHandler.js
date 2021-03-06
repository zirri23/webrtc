exports.ReadyHandler = {
  handlePlay: function(play, game, gamePlayer, models, t, callback) {
    if (game.getMetadata("status") != "dealt") {
      callback("Can't declare ready when cards are not dealt", null);
      return;
    }
    gamePlayer.setMetadata("status", "ready");
    gamePlayer.save(null, {transacting: t}).then(function(gamePlayer) {
      var nonReadyGamePlayers = game.related("gamePlayers").filter(function(gamePlayer) {
        return "active" == gamePlayer.getMetadata("status");
      });

      game.setMetadata("status", (nonReadyGamePlayers.length == 0 ? "ready" : "dealt"));
      game.save(null, {transacting: t}).then(function(game) {
        callback(null, {status: game.status});
      }).catch(function(err) {
        callback(err, {});
      });
    });
  }
};