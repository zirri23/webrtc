var cards = require('./cards');
var InitHandler = require('./handlers/InitHandler').InitHandler;
var DealHandler = require('./handlers/DealHandler').DealHandler;
var JoinHandler = require('./handlers/JoinHandler').JoinHandler;
var DropHandler = require('./handlers/DropHandler').DropHandler;
var ReadyHandler = require('./handlers/ReadyHandler').ReadyHandler;
var DryHandler = require('./handlers/DryHandler').DryHandler;

var playHandlerMap = {
  "init"    : InitHandler,
  "deal"    : DealHandler,
  "join"    : JoinHandler,
  "drop"    : DropHandler,
  "ready"   : ReadyHandler,
  "dry"     : DryHandler,
  "show-dry": DryHandler,
};

exports.handlePlay = function(playerId, gamePlayer, type, metadata, models, callback) {
  gamePlayer.game(function(err, game){
    game.gamePlayers(function(err, gamePlayers){
      var gamePlayerMapById = {};
      for (var i = 0; i < gamePlayers.length; i++) {
        gamePlayerMapById[gamePlayers[i]] = gamePlayers[i];
      }
      models.Play.create({
        gameId: game.id,
        playerId: playerId,
        gamePlayerId: gamePlayer.id,
        session: game.session,
        type: type}, function (err, play) {
        play.setMetadata(metadata, function(err, savedPlayMetadata) {
          new playHandlerMap[play.type]().handlePlay(
              play,
              game,
              gamePlayer,
              gamePlayerMapById,
              savedPlayMetadata,
              function(err, details) {
                if (err) {
                  deletePlay(savedPlayMetadata, play, callback, err, details);
                } else {
                  callback(err, details);
                }
              });
        });
      });
    });
  });
};

function deletePlay(savedPlayMetadata, play, callback, err, details) {
  var metadataCount = Object.keys(savedPlayMetadata).length;
  if (metadataCount == 0) {
    play.destroy(function (unused) {
      callback(err, details);
      return;
    });
  }
  for (key in savedPlayMetadata) {
    savedPlayMetadata[key].destroy(function(unused) {
      if (--metadataCount == 0) {
        play.destroy(function (unused) {
          callback(err, details);
          return;
        });
      }
    });
  }
}