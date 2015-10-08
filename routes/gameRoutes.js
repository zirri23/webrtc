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
    models.GamePlayer.forge({
      game_id: game.get('id'),
      player_id: req.user.id,
      uuid: uuid.v4()
    }).save().then(function(gameplayer) {
      res.redirect("/playGame?gameId=" + game.get('uuid'));
    }).catch(function(err) {
      res.send(500, "Unable to create GamePlayer: " + JSON.stringify(err));
    }).catch(function(err) {
      res.send(500, "Unable to create Game: " + JSON.stringify(err));
    });
  });
};
exports.playGame = function(req, res) {
  var gameId = req.query.gameId;
  var playerId = req.user.id;
  var game = models.Game.where({uuid: gameId}).fetch().then(function(game) {
    models.GamePlayer.where({game_id: game.get("id"), player_id: playerId}).fetch().then(function(gamePlayer) {
      res.render('game/video.html', {
        game: game,
        gamePlayer: gamePlayer,
        player: req.user,
        csrfToken: req.session._csrf});
    }).catch(function(err) {
      res.send(500, "GamePlayer not found: " + JSON.stringify(err));
    });
  }).catch(function(err) {
    res.send(500, "Game not found: " + JSON.stringify(err));
  });
};