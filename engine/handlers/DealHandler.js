var cards = require('../cards');
var util = require('util');

exports.DealHandler = function(models) {
  this.handlePlay = function(play, game, gamePlayer, gamePlayerMapById, playMetadata, callback) {
    game.getMetadata(["deck", "dealer", "turnGamePlayer",
                      "cardsLeftToPlay", "leadGamePlayer", "leadCard"], function (err, gameMetadata) {
      if (gameMetadata.dealer.value != gamePlayer.pk) {
        callback("You are not the dealer", null);
        return;
      }
      gameMetadata.leadCard.value = null;
      gameMetadata.leadGamePlayer.value = null;
      game.status = "dealt";
      gameMetadata.leadGamePlayer.save();
      gameMetadata.leadCard.save();
      game.gamePlayers({where: {status: {inq: ['active', 'observer', 'ready']}}}, function(err, activeGamePlayers) {
        game.session++;
        var session = game.session;
        game.save();
        
        var cardsNeeded = activeGamePlayers.length * 5;
        gameMetadata.cardsLeftToPlay.value = cardsNeeded;
        gameMetadata.cardsLeftToPlay.save();
        if (gameMetadata.deck.value.length < cardsNeeded) {
          gameMetadata.deck.value = cards.getSparDeck();
        }
        var count = activeGamePlayers.length;
        var deck = gameMetadata.deck.value;
        var playerHands = createHands (activeGamePlayers, deck);
        deck = deck.slice(cardsNeeded);
        for (var i = 0; i < activeGamePlayers.length; i++) {
          if (activeGamePlayers[i].id == gamePlayer.id) {
            var nextIndex = (i + 1) < activeGamePlayers.length ? (i + 1) : 0;
            gameMetadata.dealer.value = activeGamePlayers[nextIndex].pk;
            gameMetadata.dealer.save();
          }
          activeGamePlayers[i].status = 'active';
          activeGamePlayers[i].save();
          activeGamePlayers[i].getMetadata(['hands', 'winStacks'], function (err, gamePlayerMetadata) {
            var hand = playerHands[gamePlayerMetadata.hands.gamePlayerId];
            gamePlayerMetadata.hands.value[session] = hand;
            gamePlayerMetadata.winStacks.value[session] = [];
            
            gamePlayerMetadata.hands.save();
            gamePlayerMetadata.winStacks.save();
            
            if(--count == 0) {
              gameMetadata.deck.value = deck;
              gameMetadata.deck.save();
              callback(err, {session: session, turnGamePlayer: gameMetadata.turnGamePlayer.value});
            }
          }, /* retrieveDbObject */ true);
        }
      });
    }, /* retrieveDbObject */ true);
  };
};

function createHands (activeGamePlayers, deck) {
  var hands = {};
  for (var i = 0; i < activeGamePlayers.length; i++) {
    var hand = deck.slice(0,5);
    var handObject = {};
    for (var j = 0; j < hand.length; j++) {
      handObject[hand[j]] = {play: "unplayed", modifier: "drop", index: j + 1};
    }
    hands[util.format("%s", activeGamePlayers[i].id)] = handObject;
    deck = deck.slice(5);
  }
  return hands;
}