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
  models.Player.where({id: -1}).then
  models.GamePlayer.forge({
    game_id: game.get("id"),
    game_uuid: game.get("uuid"),
    player_id: -1,
    player_uuid: "-1",
    uuid: uuid.v4()
  }).save(null, {transacting: t}).then(function(gamePlayer) {
    gamePlayer.refresh({withRelated: ["game", "game.gamePlayers"], transacting: t}).then(function(gamePlayer) {
      callback(gamePlayer, models, t);
    });
  }).catch(function(err) {
    t.rollback();
    res.send(500, "Unable to create GamePlayer: " + JSON.stringify(err));
  });
}

function handleBotPlays(game, type, models, t, callback) {
  var nextGamePlayer = game.related("gamePlayers").findWhere({uuid: game.getMetadata("turnGamePlayer")});
  console.log(nextGamePlayer);
  var botPk = nextGamePlayer.get("uuid");
  if (nextGamePlayer.getMetadata("isBot")) {
    var botType = nextGamePlayer.getMetadata("botType");
    var metadata = playHandlerMap[botType].handle(game, nextGamePlayer, models, t);
    exports.handlePlay(botPk, game, type, metadata, models, t, callback);
  } else {
    callback({});
  }
}