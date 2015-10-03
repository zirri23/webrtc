var uuid = require('node-uuid');

exports.setModels = function(m) {
  models = m;
};

exports.setIo = function(i) {
  io = i;
};

exports.createGame = function(req, res) {
  models.Game.forge({creator: req.user.id, uuid: uuid.v4()}).save().then(function (game) {
    console.log("Created a game with id: " + game.get('uuid'));
//    game.createMetadatum({key: "boob", value: "boob"}).then(function(cr, crea) {
//      console.log("Game has metadata: " + cr);
//    });
    res.redirect("/playGame?gameId=" + game.get('uuid'));
  });
};
exports.playGame = function(req, res) {
  var gameId = req.query.gameId;
  var playerId = req.user.id;
  var game = models.Game.where({uuid: gameId}).fetch().then(function(game) {
    models.GamePlayer.where({gameId: game.get("id"), playerId: playerId}).fetch().then(function(gamePlayer) {
      res.render('game/video.html', {
        //game: game,
        //gamePlayer: gamePlayer,
        //player: player,
        csrfToken: req.session._csrf});
    }).catch(function(err) {
      res.send(500, "GamePlayer not found: " + JSON.stringify(err));
    });
  }).catch(function(err) {
    res.send(500, "Game not found: " + JSON.stringify(err));
  });
};