var cards = require("../cards");

exports.DealHandler = {
  handlePlay: function(play, game, gamePlayer, models, t, callback) {
    var gameMetadata = game.getAllMetadata();

    if (gameMetadata.dealer != gamePlayer.get("uuid")) {
      return callback("You are not the dealer", null);
    }
    gameMetadata.status = "dealt";

    var activeGamePlayers = game.related("gamePlayers").filter(function(gamePlayer) {
      return ["active", "observer", "ready"].indexOf(gamePlayer.getMetadata("status")) >= 0;
    });

    if(activeGamePlayers.length < 2) {
      return callback("You need at least 2 players to deal!", {});
    }

    var session = gameMetadata.session;

    var cardsNeeded = activeGamePlayers.length * 5;
    if (gameMetadata.deck.length < cardsNeeded) {
      gameMetadata.deck = cards.getSparDeck();
    }
    var deck = gameMetadata.deck;

    createHands (session, activeGamePlayers, deck);
    deck = deck.slice(cardsNeeded);

    for (var i = 0; i < activeGamePlayers.length; i++) {
      if (activeGamePlayers[i].id == gamePlayer.id) {
        var nextIndex = (i + 1) % activeGamePlayers.length;
        var count = i;
        while (activeGamePlayers[nextIndex].getMetadata("isBot")) {
          nextIndex = (++count + 1) % activeGamePlayers.length;
        }
        gameMetadata.dealer = activeGamePlayers[nextIndex].get("uuid");
      }
      activeGamePlayers[i].setMetadata("status", "active");
    }
    gameMetadata.deck = deck;
    game.setAllMetadata(gameMetadata);
    game.save(null, {transacting: t}).then(function(game) {
      models.GamePlayer.collection(activeGamePlayers).invokeThen('save', null, {transacting: t}).then(function(a) {
        callback("", {session: session, turnGamePlayer: gameMetadata.turnGamePlayer})
      }).catch(function(err) {
        callback(err, {});
      });
    }).catch(function(err) {
      callback(err, {});
    });
  }
};

function createHands (session, activeGamePlayers, deck) {
  var hands = {};
  for (var i = 0; i < activeGamePlayers.length; i++) {
    var hand = deck.slice(0,5);
    var handObject = [];
    for (var j = 0; j < hand.length; j++) {
      handObject[j] = {card: hand[j], play: "unplayed", modifier: "none"};
    }
    var activeGamePlayerMetadata = activeGamePlayers[i].getAllMetadata();
    activeGamePlayerMetadata.hands[session] = handObject;
    activeGamePlayers[i].setAllMetadata(activeGamePlayerMetadata);
    deck = deck.slice(5);
  }
  return hands;
}