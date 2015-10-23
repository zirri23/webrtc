var cards = require('./cards');
var InitHandler = require('./handlers/InitHandler').InitHandler;
var DealHandler = require('./handlers/DealHandler').DealHandler;
var JoinHandler = require('./handlers/JoinHandler').JoinHandler;
var DropHandler = require('./handlers/DropHandler').DropHandler;
var ReadyHandler = require('./handlers/ReadyHandler').ReadyHandler;
var DryHandler = require('./handlers/DryHandler').DryHandler;
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

exports.handlePlay = function(gamePlayer, type, metadata, models, t, callback) {
  var game = gamePlayer.related('game');
  var gamePlayers = game.related('gamePlayers');

  var gamePlayerMap = {};
  gamePlayers.map(function(gamePlayer) { gamePlayerMap[gamePlayer.get("uuid")] = gamePlayer});

  var play = models.Play.forge({
    uuid: uuid.v4(),
    game_id: game.get("id"),
    game_uuid: game.get("uuid"),
    player_id: gamePlayer.get("player_id"),
    player_uuid: gamePlayer.get("player_uuid"),
    game_player_id: gamePlayer.get("id"),
    game_player_uuid: gamePlayer.get("uuid")});

  play.setMetadata("session", game.get("session"));
  play.setMetadata("type", type);
  play.setAllMetadata(metadata);

  play.save(null, {transacting: t}).then(function(play) {
    playHandlerMap[play.getMetadata("type")].handlePlay(
        play,
        game,
        gamePlayer,
        gamePlayerMap,
        t,
        function(err, details) {
          callback(err, details);
        });
  });
};
