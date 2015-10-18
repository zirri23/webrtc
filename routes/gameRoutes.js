var uuid = require('node-uuid');
var sockets = require("../sockets");
var util = require('util');

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
      game_uuid: game.get('uuid'),
      player_id: req.user.id,
      player_uuid: req.user.get('uuid'),
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

  models.GamePlayer.where({game_uuid: gameId, player_id: playerId}).fetch(
      {withRelated: ['game', "game.gamePlayers", "game.gamePlayers.player"]}
  ).then(function(gamePlayer) {
    var game = gamePlayer.related("game");
    res.render('game/game.html', {
      game: game.toJSON(),
      gamePlayer: gamePlayer.toJSON(),
      player: req.user.toJSON(),
      csrfToken: req.session._csrf});
  }).catch(function(err) {
        res.send(500, util.format("%s is not a member of this game", req.user.get("uuid")));
  });
};

exports.joinGame = function(req, res) {
  var playerId = req.user.id;
  var gamePk = req.query.gameId;

  models.GamePlayer.where({game_uuid: gamePk, player_id: playerId}).fetch({}).then(function(gamePlayer) {
    if (gamePlayer) {
      res.redirect(util.format('/playGame?gameId=%s', gamePk));
    } else models.Game.where({uuid: gamePk}).fetch().then(function (game) {
      models.GamePlayer.forge({
        game_id: game.get('id'),
        game_uuid: gamePk,
        player_id: req.user.id,
        player_uuid: req.user.get('uuid'),
        uuid: uuid.v4()
      }).save().then(function (gameplayer) {
        res.redirect("/playGame?gameId=" + gamePk);
      }).catch(function (err) {
        res.send(500, "Unable to create GamePlayer: " + JSON.stringify(err));
      });
    }).catch(function (err) {
      res.send(500, util.format("%s is not a member of this game", req.user.get("uuid")));
    });
  });
}


exports.queryGames = function(req, res) {
    models.Game.where({}).fetchAll({withRelated: ['gamePlayers', "gamePlayers.player", "creator"]}).then(function(games) {
        console.log(games.toJSON());
        res.send(games.toJSON());
    }).catch(function(err) {
        res.send(500, "Unable to create games" + JSON.stringify(err));
    });
}

exports.sendChatMessage = function(req, res) {
  var playerId = req.user.id;
  var gamePk = req.body.gamePk;
  var gamePlayerPk = req.body.gamePlayerPk;
  models.GamePlayer. where({uuid: gamePlayerPk}).fetch().then(function(gamePlayer) {
    if(!gamePlayer) {
      res.send(500, util.format("%s is not a member of this game", gamePk));
    } else if(gamePlayer.get('player_id') != playerId) {
      res.send(500, util.format("Not allowed to send chats for: %s", gamePlayerPk));
    } else {
      sockets.broadcastMessage(io, 'chat message', gamePk, {
        text: req.body.message,
        sender: req.body.name,
        time: new Date().getTime(),
        senderPk: gamePlayer.get('uuid'),
        avatar: req.body.avatar
      });
      res.send(200);
    }
  });
};