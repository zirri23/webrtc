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

exports.handlePlay = function(gamePlayer, game, type, metadata, models, t, callback) {
  var gamePlayers = game.related('gamePlayers');

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

  // Replace gamePlayer with the one from the list. Prevents bugs
  // caused by 2 versions of the gamePlayer existing (one standalone and one in the list)
  gamePlayer = game.related("gamePlayers").findWhere({id: gamePlayer.get("id")}) || gamePlayer;

  play.save(null, {transacting: t}).then(function(play) {
    playHandlerMap[play.getMetadata("type")].handlePlay(
        play,
        game,
        gamePlayer,
        models,
        t,
        function(err, details) {
          play.setAllMetadata(details);
          play.save(null, {transacting: t}).then(function(play) {
            callback(err, details);
          });
        });
  });
};
