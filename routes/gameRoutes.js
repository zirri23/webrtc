var uuid = require("node-uuid");
var sockets = require("../sockets");
var util = require("util");
var engine = require("../engine/gameEngine");

exports.createGame = function(req, res, models, io, t) {
  models.Game.forge({creator: req.user.id, uuid: uuid.v4()}).save(null, {transacting: t}).then(function (game) {
    console.log("Created a game with id: " + game.get("uuid"));
    models.GamePlayer.forge({
      game_id: game.get("id"),
      game_uuid: game.get("uuid"),
      player_id: req.user.id,
      player_uuid: req.user.get("uuid"),
      uuid: uuid.v4()
    }).save(null, {transacting: t}).then(function(gamePlayer) {
      gamePlayer.refresh({withRelated: ["game", "game.gamePlayers"], transacting: t}).then(function(gamePlayer) {
        engine.handlePlay(gamePlayer, gamePlayer.related("game"), "init", {}, models, t, function(err, result) {
          engine.handlePlay(gamePlayer, gamePlayer.related("game"), "join", {}, models, t, function(err, result) {
            if (!err) {
              t.commit();
              res.redirect("/playGame?gameId=" + game.get("uuid"));
            } else {
              t.rollback();
              res.send(500, "Unable to create Game " + JSON.stringify(err));
            }
          });
        });
      });
    }).catch(function(err) {
      t.rollback();
      res.send(500, "Unable to create GamePlayer: " + JSON.stringify(err));
    });
  }).catch(function(err) {
    t.rollback();
    res.send(500, "Unable to create Game: " + JSON.stringify(err));
  });
};

exports.playGame = function(req, res, models, io) {
  var gameId = req.query.gameId;
  var playerId = req.user.id;

  models.GamePlayer.where({game_uuid: gameId, player_id: playerId}).fetch(
      {withRelated: ["game", "game.gamePlayers", "game.gamePlayers.player", "game.plays"]}
  ).then(function(gamePlayer) {
    var game = gamePlayer.related("game");
    res.render("game/game.html", {
      game: game.toJSON(),
      gamePlayer: gamePlayer.toJSON(),
      player: req.user.toJSON(),
      csrfToken: req.session._csrf});
  }).catch(function(err) {
    res.send(500, util.format("%s is not a member of this game", req.user.get("uuid")));
  });
};

exports.joinGame = function(req, res, models, io, t) {
  var playerId = req.user.id;
  var gamePk = req.query.gameId;

  models.GamePlayer.where({game_uuid: gamePk, player_id: playerId}).fetch({transacting: t}).then(function(gamePlayer) {
    if (gamePlayer) {
      t.commit();
      res.redirect(util.format("/playGame?gameId=%s", gamePk));
    } else models.Game.where({uuid: gamePk}).fetch({withRelated: ["gamePlayers"], transacting: t}).then(function (game) {
      models.GamePlayer.forge({
        game_id: game.get("id"),
        game_uuid: gamePk,
        player_id: req.user.id,
        player_uuid: req.user.get("uuid"),
        uuid: uuid.v4()
      }).save(null, {transacting: t}).then(function (gamePlayer) {
        engine.handlePlay(gamePlayer, game, "join", {}, models, t, function(err, result) {
          if (!err) {
            t.commit();
            gamePlayer.set("player", req.user);
            sockets.broadcastMessage(io, 'room change', game.get("uuid"), {
              present: true,
              gamePlayer: gamePlayer.toJSON(),
            });
            res.redirect("/playGame?gameId=" + game.get("uuid"));
          } else {
            t.rollback();
            res.send(500, "Unable to join Game " + JSON.stringify(err));
          }
        });
      }).catch(function (err) {
        t.rollback();
        res.send(500, "Unable to create GamePlayer: " + JSON.stringify(err));
      });
    }).catch(function (err) {
      t.rollback();
      res.send(500, util.format("%s is not a member of this game", req.user.get("uuid")));
    });
  });
};

exports.queryGames = function(req, res, models, io) {
    models.Game.where({}).fetchAll({withRelated: ["gamePlayers", "gamePlayers.player", "creator"]}).then(function(games) {
        res.send(games.toJSON());
    }).catch(function(err) {
        res.send(500, "Unable to create games" + JSON.stringify(err));
    });
};

exports.sendChatMessage = function(req, res, models, io) {
  var playerId = req.user.id;
  var gamePk = req.body.gamePk;
  var gamePlayerPk = req.body.gamePlayerPk;
  models.GamePlayer. where({uuid: gamePlayerPk}).fetch().then(function(gamePlayer) {
    if(!gamePlayer) {
      res.send(500, util.format("%s is not a member of this game", gamePk));
    } else if(gamePlayer.get("player_id") != playerId) {
      res.send(500, util.format("Not allowed to send chats for: %s", gamePlayerPk));
    } else {
      sockets.broadcastMessage(io, "chat message", gamePk, {
        text: req.body.message,
        sender: req.body.name,
        time: new Date().getTime(),
        senderPk: gamePlayer.get("uuid"),
        avatar: req.body.avatar
      });
      res.send(200);
    }
  });
};

exports.sendPlay = function(req, res, models, io, t) {
  var playerId = req.user.id;
  var gamePk = req.body.gamePk;
  var gamePlayerPk = req.body.gamePlayerPk;
  models.GamePlayer.where({uuid: gamePlayerPk}).fetch({withRelated: ["game", "game.gamePlayers"], transacting: t}).then(function(gamePlayer) {
    if(!gamePlayer) {
      t.rollback();
      res.send(500, util.format("%s is not a member of this game", gamePk));
    } else if(gamePlayer.get("player_id") != playerId) {
      t.rollback();
      res.send(500, util.format("Not allowed to send plays for: %s", gamePlayerPk));
    } else {
      engine.handlePlay(gamePlayer, gamePlayer.related("game"), req.body.type, req.body.metadata, models, t, function(err, details){
        if (err) {
          t.rollback();
          res.send(500, err);
        } else {
          t.commit();
          sockets.broadcastMessage(io, req.body.type, gamePk, {
            details: details,
            sender: req.body.name,
            type: req.body.type,
            time: new Date().getTime(),
            senderPk: gamePlayer.get("uuid"),
            avatar: req.body.avatar
          });
          res.send(200);
        }
      });
    }
  });
};

exports.getCards = function(req, res, models, io) {
  var playerId = req.user.id;
  var gamePlayerPk = req.body.gamePlayerPk;
  var gamePk = req.body.gamePk;

  models.GamePlayer.where({uuid: gamePlayerPk}).fetch({withRelated: ["game", "game.gamePlayers"]}).then(function(gamePlayer) {
    if(!gamePlayer) {
      res.send(500, util.format("%s is not a member of this game", gamePk));
    } else if(gamePlayer.get("player_id") != playerId) {
      res.send(500, util.format("Not allowed to send plays for: %s", gamePlayerPk));
    } else {
      var hands = {}
      var game = gamePlayer.related("game");
      game.related("gamePlayers").forEach(function(gamePlayer) {
        var gamePlayerHand = gamePlayer.getMetadata("hands")[game.getMetadata("session")];
        if (gamePlayer.get("uuid") !== gamePlayerPk) {
          for (var i = 0; i < gamePlayerHand.length; i++) {
            if (gamePlayerHand[i].modifier != "show-dry") {
              gamePlayerHand[i].card = null;
            }
          }
        }
        hands[gamePlayer.get("uuid")] = gamePlayerHand;
      });
      res.send(hands);
    }
  });
};