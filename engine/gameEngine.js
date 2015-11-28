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
  "basic"   : BOTS.BASIC,
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
  playHandlerMap[play.getMetadata("type")].handlePlay(
    play, game, gamePlayer, models, t,
    function(err, details) {
      handleBotPlays(game, type, models, t, function(botPlay) {
        play.setAllMetadata(details);
        play.save(null, {transacting: t}).then(function(play) {
          var version = game.getMetadata("version") + 1;
          game.setMetadata("version", version);
          game.save(null, {transacting: t}).then(function(game) {
            details["version"] = version;
            details["botPlay"] = botPlay;
            callback(err, details);
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
      createBotFromPlayer(botPlayer, game, models, t, callback);
    }
  });
}

function createBotFromPlayer(player, game, models, t, callback) {
  console.log("Creating Bot: " + player.id);
  models.GamePlayer.forge({
    game_id: game.get("id"),
    game_uuid: game.get("uuid"),
    player_id: player.get("id"),
    player_uuid: player.get("uuid"),
    uuid: uuid.v4()
  }).save(null, {transacting: t}).then(function(gamePlayer) {
    console.log("Bot Gameplayer created");
    console.log("Initing: " + gamePlayer.get("uuid"));
    game.refresh({withRelated: ["gamePlayers"], transacting: t}).then(function(game) {
      console.log("Refreshed game, initing bot");
      exports.handlePlay(gamePlayer.get("uuid"), game, "join", {}, models, t, callback);
    });
  }).catch(function(err) {
    callback(err, null);
  });
}

function handleBotPlays(game, type, models, t, callback) {
  var nextGamePlayerPk = game.getMetadata("turnGamePlayer");
  if (!nextGamePlayerPk) {
    callback({});
  }
  var nextGamePlayer = game.related("gamePlayers").findWhere({uuid: nextGamePlayerPk});
  var botPk = nextGamePlayer.get("uuid");
  if (nextGamePlayer.getMetadata("isBot")) {
    var botType = nextGamePlayer.getMetadata("botType");
    var metadata = playHandlerMap[botType].handle(game, nextGamePlayer, models, t);
    exports.handlePlay(botPk, game, type, metadata, models, t, callback);
  } else {
    callback({});
  }
}