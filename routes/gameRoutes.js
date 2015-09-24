exports.setModels = function(m) {
  models = m;
};

exports.setIo = function(i) {
  io = i;
};

exports.createGame = function(req, res) {
  models.Game.create({creator: req.user.id}).then(function(game, created) {
    console.log("Created a game with id: " + game.uuid);
    console.log(game);
    game.createMetadatum({key: "boob", value: "boob"}).then(function(cr, crea) {
      console.log("Game has metadata: " + cr);
    });
  });
};