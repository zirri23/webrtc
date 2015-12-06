var cards = require('./cards');
var InitHandler = require('./handlers/InitHandler').InitHandler;
var DealHandler = require('./handlers/DealHandler').DealHandler;
var JoinHandler = require('./handlers/JoinHandler').JoinHandler;
var DropHandler = require('./handlers/DropHandler').DropHandler;
var ReadyHandler = require('./handlers/ReadyHandler').ReadyHandler;
var DryHandler = require('./handlers/DryHandler').DryHandler;
var BasicBot = require('./bots/BasicBot').BasicBot;
var uuid = require("node-uuid");

var playHandlerMap = {
  "init"    : InitHandler,
  "deal"    : DealHandler,
  "join"    : JoinHandler,
  "drop"    : DropHandler,
  "ready"   : ReadyHandler,
  "dry"     : DryHandler,
  "show-dry": DryHandler,
};

var BOTS = {BASIC: "basic"};
exports.BOTS = BOTS;

var botMap = {
  "basic"   : BasicBot,
}

exports.handlePlay = function(gamePlayerPk, game, type, metadata, models, t, callback) {
  game.refresh({withRelated: ["gamePlayers", "plays"], transacting: t}).then(function(game) {
    var gamePlayer = game.related("gamePlayers").findWhere({uuid: gamePlayerPk});

    var play = models.Play.forge({
      uuid: uuid.v4(),
      game_id: game.get("id"),
      game_uuid: game.get("uuid"),
      player_id: gamePlayer.get("player_id"),
      player_uuid: gamePlayer.get("player_uuid"),
      game_player_id: gamePlayer.get("id"),
      game_player_uuid: gamePlayer.get("uuid")});
    play.setMetadata("session", game.getMetadata("session"));
    play.setMetadata("type", type);

    play.setAllMetadata(metadata);
    playHandlerMap[play.getMetadata("type")].handlePlay(play, game, gamePlayer, models, t, function (err, details) {
      if (err) {
        console.log(err);
        return callback(err, null);
      }
      play.setAllMetadata(details);
      play.save(null, {transacting: t}).then(function (play) {
        handleBotPlays(gamePlayer, game, type, models, t, function (err, botPlay) {
          game.save(null, {transacting: t}).then(function (game) {
            var version = game.getMetadata("version") + 1;
            game.setMetadata("version", version);
            details["version"] = game.getMetadata("version");
            details["botPlay"] = botPlay;
            callback(err, details);
          });
        });
      });
    });
  });
};

exports.createBot = function(game, botType, models, t, callback) {
  models.Player.where({remote_id: -1}).fetch({transacting: t}).then(function(botPlayer) {
    if (!botPlayer) {
      callback("Bot player not found", null);
    } else {
      createBotFromPlayer(botPlayer, botType, game, models, t, callback);
    }
  });
}

function createBotFromPlayer(player, botType, game, models, t, callback) {
  models.GamePlayer.forge({
    game_id: game.get("id"),
    game_uuid: game.get("uuid"),
    player_id: player.get("id"),
    player_uuid: player.get("uuid"),
    uuid: uuid.v4()
  }).save(null, {transacting: t}).then(function(gamePlayer) {
    gamePlayer.setMetadata("isBot", "true");
    gamePlayer.setMetadata("botType", botType);
    gamePlayer.save(null, {transacting: t}).then(function(gamePlayer) {
      game.refresh({withRelated: ["gamePlayers"], transacting: t}).then(function(game) {
        exports.handlePlay(gamePlayer.get("uuid"), game, "join", {}, models, t, callback);
      });
    });
  }).catch(function(err) {
    callback(err, null);
  });
}

function handleBotPlays(gamePlayer, game, type, models, t, callback) {
  var botGamePlayer = game.related("gamePlayers").find(function(gamePlayer) {
    return gamePlayer.getMetadata("isBot") == "true";
  });
  if (!botGamePlayer) {
    return callback(null, null);
  }
  var botPk = botGamePlayer.get("uuid");
  var botType = botGamePlayer.getMetadata("botType");
  botMap[botType].handlePlay(game, botGamePlayer, models, t, function(err, response) {
    if (err) {
      console.log(err);
      return callback(err, null);
    }
    if (!response) {
      return callback(null, null);
    }
    exports.handlePlay(botPk, game, response["play"], response["metadata"], models, t, function(err, details) {
      if (err) {
        console.log(err);
        return callback(err, null);
      }
      callback(null, {type: response["play"], botPlayer: botPk, details: details});
    });
  });
}