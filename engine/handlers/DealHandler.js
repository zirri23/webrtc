var cards = require("../cards");
var util = require("util");

exports.DealHandler = {
  handlePlay: function(play, game, gamePlayer, gamePlayerMapById, t, callback) {
    var gameMetadata = game.getAllMetadata();

    if (gameMetadata.dealer != gamePlayer.get("uuid")) {
      return callback("You are not the dealer", null);
    }
    gameMetadata.status = "dealt";

    var activeGamePlayers = game.related("gamePlayers").filter(function(gamePlayer) {
      return ["active", "observer", "ready"].indexOf(gamePlayer.getMetadata("status")) >= 0;
    });

    var session = gameMetadata.session;

    if (gameMetadata.deck.length < cardsNeeded) {
      gameMetadata.deck = cards.getSparDeck();
    }
    var deck = gameMetadata.deck;
    var playerHands = createHands (activeGamePlayers, deck);
    if (gameMetadata.hands == null || gameMetadata.hands == undefined) {
      gameMetadata.hands = {}
    }
    gameMetadata.hands[session] = playerHands;

    var cardsNeeded = activeGamePlayers.length * 5;
    deck = deck.slice(cardsNeeded);

    for (var i = 0; i < activeGamePlayers.length; i++) {
      if (activeGamePlayers[i].id == gamePlayer.id) {
        var nextIndex = (i + 1) % activeGamePlayers.length;
        gameMetadata.dealer = activeGamePlayers[nextIndex].get("uuid");
      }
      activeGamePlayers[i].setMetadata("status", "active");
    }
    gameMetadata.deck = deck;
    game.setAllMetadata(gameMetadata);
    console.log(game.getMetadata("status") + "*********************");
    game.save(null, {transacting: t}).then(function(game) {
      callback("", {session: session, turnGamePlayer: gameMetadata.turnGamePlayer});
    }).catch(function(err) {
      callback(err, {});
    });
  }
};

function createHands (activeGamePlayers, deck) {
  var hands = {};
  for (var i = 0; i < activeGamePlayers.length; i++) {
    var hand = deck.slice(0,5);
    var handObject = {};
    for (var j = 0; j < hand.length; j++) {
      handObject[j] = {card: hand[j], play: "unplayed", modifier: "drop", index: j + 1};
    }
    hands[activeGamePlayers[i].get("uuid")] = handObject;
    deck = deck.slice(5);
  }
  return hands;
}