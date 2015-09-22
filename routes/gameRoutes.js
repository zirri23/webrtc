var expand = require('./dbUtils').expand;
var async = require('async');
var util = require("util");

exports.setModels = function(m) {
  models = m;
};

exports.setIo = function(i) {
  io = i;
};

exports.createGame = function(req, res) {
  models.Game.create({creatorId: req.user.id}).then(function(game, created) {
    models.GamePlayer.create({gameId: game.id, playerId: req.user.id}).then(
        function(gamePlayer, created) {
          res.send(200);
        });
  });
};

exports.playGame = function(req, res) {
  var gameId = req.query.gameId;
  var playerId = req.user.id;
  models.Game.findOne({uuid: gameId}).then(function(game, found) {
    if(!game) {
      res.send(500, util.format("Game: %s does not exist", gameId));
    } else {
      models.GamePlayer.findOne({
        gameId: game.id, playerId: playerId}).then(function(gamePlayer, find) {
          console.log(gamePlayer);
          if(!gamePlayer) {
            res.send(500, util.format("Not a member of this game", gameId));
          } else {
            async.map([req.user, game], expand,
                function(err, results) {
                  res.render('game/game.html', {
                    fish: "fish",
                    game: results[1],
                    player: results[0],
                    csrfToken: req.session._csrf});
                }
            );
          }
        });
    }
  });
};