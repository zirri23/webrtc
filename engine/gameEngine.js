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
  game.save(null, {transacting: t}).then(function(game) {
    playHandlerMap[play.getMetadata("type")].handlePlay(
        play, game, gamePlayer, models, t,
        function (err, details) {
          if (err) {
            return callback(err, null);
          }
          console.log("Done handling play: " + type);
          play.setAllMetadata(details);
          play.save(null, {transacting: t}).then(function (play) {
            handleBotPlays(gamePlayer, game, type, models, t, function (err, botPlay) {
              console.log("Done handling bot play: " + type);
              var version = game.getMetadata("version") + 1;
              console.log("current game version after this play is: " + version);
              game.setMetadata("version", version);
              game.save(null, {transacting: t}).then(function (game) {
                details["version"] = version;
                details["botPlay"] = botPlay;
                callback(err, details);
              });
            });
          });
        });
  });
};

exports.createBot = function(game, botType, models, t, callback) {
  console.log("Inside create bot");
  models.Player.where({remote_id: -1}).fetch({transacting: t}).then(function(botPlayer) {
    if (!botPlayer) {
      callback("Bot player not found", null);
    } else {
      console.log("Bot player found");
      createBotFromPlayer(botPlayer, botType, game, models, t, callback);
    }
  });
}

function createBotFromPlayer(player, botType, game, models, t, callback) {
  console.log("Creating Bot: " + player.id);
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
      console.log("Bot Gameplayer created");
      console.log("Initing: " + gamePlayer.get("uuid"));
      game.refresh({withRelated: ["gamePlayers"], transacting: t}).then(function(game) {
        console.log("Refreshed game, initing bot");
        exports.handlePlay(gamePlayer.get("uuid"), game, "join", {}, models, t, callback);
      });
    });
  }).catch(function(err) {
    callback(err, null);
  });
}

function handleBotPlays(gamePlayer, game, type, models, t, callback) {
  console.log("Trying to do bot play for: " + type);
  if (gamePlayer.getMetadata("isBot")) {
    console.log("Current player is the bot. Exit loop");
    return callback(null, null);
  }
  var botGamePlayer = game.related("gamePlayers").find(function(gamePlayer) {
    return gamePlayer.getMetadata("isBot") == "true";
  });
  if (!botGamePlayer) {
    console.log("No bot player. Skipping");
    return callback(null, null);
  }
  var botPk = botGamePlayer.get("uuid");
  var botType = botGamePlayer.getMetadata("botType");
  console.log("Calling bot type: " + botType);
  console.log("Bot handlers are: " + JSON.stringify(botMap));
  console.log("Bot handler is: " + JSON.stringify(botMap[botType]));
  botMap[botType].handlePlay(game, botGamePlayer, models, t, function(err, response) {
    if (err) {
      callback(err, null);
    }
    if (!response) {
      console.log("No response. Skipping");
      return callback(null, null);
    }
    console.log("Got a response from bot: " + JSON.stringify(response));
    console.log("Doing: " + response["play"] + " for " + botPk);
    exports.handlePlay(botPk, game, response["play"], response["metadata"], models, t, function(err, details) {
      if (err) {
        return callback(err, null);
      }
      console.log("Done handling play: " + response["play"] + " with results: " + JSON.stringify(details));
      callback(null, {type: response["play"], botPlayer: botPk, details: details});
    });
  });
}