exports.ReadyHandler = function(models) {
  this.handlePlay = function(play, game, gamePlayer, gamePlayerMapById, playMetadata, callback) {
    if (game.status != "dealt") {
      callback("Can't declare ready when cards are not dealt", null);
      return;
    }
    gamePlayer.status = "ready";
    gamePlayer.save(function(err, gamePlayer) {
      game.gamePlayers({where: {status: "active"}}, function (err, nonReadyGamePlayers){
        if (nonReadyGamePlayers.length == 0) {
          game.status = "ready";
          game.save();
        }
        callback(null, {status: game.status});
      });
    });
  };
};