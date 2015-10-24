var util = require('util');
var cards = require('../cards');

var pointsMap = {
  6    : {"drop": 3, "dry": 6, "show-dry": 12},
  7    : {"drop": 2, "dry": 4, "show-dry": 8},
  other: {"drop": 1, "dry": 1, "show-dry": 1}
};

exports.DropHandler = {
  handlePlay: function(play, game, gamePlayer, gamePlayerMapById, playMetadata, models, t, callback) {
    game.getMetadata(["turnGamePlayer", "leadCard", "leadGamePlayer", "dealer",
                      "cardsLeftToPlay"], function(err, gameMetadata) {
      if (game.status != "ready") {
        callback("Can't play until everyone is ready", null);
        return;
      }
      if (gameMetadata.turnGamePlayer.value != gamePlayer.pk) {
        callback("Not your turn", null);
        return;
      }
      var session = game.session;
      gamePlayer.getMetadata(["hands", "winStacks"], function(err, gamePlayerMetadata) {
        var firstCard = playMetadata.cards.value[0];
        if (!gamePlayerMetadata.hands.value[session][firstCard]) {
          callback("Unknown card played", null);
          return;
        }
        if (gamePlayerMetadata.hands.value[session][firstCard].play === "drop") {
          callback("Card already played", null);
          return;
        }
        if (isGbaa(
            gameMetadata.leadGamePlayer.value, 
            gamePlayer.pk,
            firstCard, 
            gameMetadata.leadCard.value, 
            gamePlayerMetadata.hands.value[session])) {
          callback(util.format("You must play a card of suit %s", cards.valueOf(gameMetadata.leadCard.value).suit), null);
          return;
        }
        var playedCards = [];
        for(var cc = 0; cc < playMetadata.cards.value.length; cc++) {
          var currentCard = playMetadata.cards.value[cc];
          playedCards.push({
              card: currentCard,
              index: gamePlayerMetadata.hands.value[session][currentCard].index});
        }
        gameMetadata.cardsLeftToPlay.value--;
        gameMetadata.cardsLeftToPlay.save();
        gamePlayerMetadata.hands.value[session][firstCard].play = play.type;
        gamePlayerMetadata.hands.save();
        
        determineLeaderAndNextTurn(game, gamePlayer, play, gameMetadata, gamePlayerMetadata, playMetadata, function(){
          processSessionOver(
              session,
              game,
              gameMetadata,
              function(isSessionOver, score){
                callback(null, {
                  isSessionOver: isSessionOver,
                  score: score,
                  playType: play.type,
                  cards: playedCards,
                  leadCard: gameMetadata.leadCard.value,
                  leadGamePlayer: gameMetadata.leadGamePlayer.value,
                  turnGamePlayer: gameMetadata.turnGamePlayer.value,
                  dealer: gameMetadata.dealer.value
                });
                gameMetadata.leadGamePlayer.save();
                gameMetadata.leadCard.save();
                gameMetadata.turnGamePlayer.save();
              });
        });
      }, /* retrieveDbObject */ true);
    }, /* retrieveDbObject */ true);
  }
};

function isGbaa(leadGamePlayer, gamePlayerPk, firstCard, leadCard, hand) {
  // Can't gbaa if you're in the lead
  if (leadGamePlayer === gamePlayerPk) {
    return false;
  }
  // No gbaa here
  if (!leadCard || cards.valueOf(firstCard).suit === cards.valueOf(leadCard).suit) {
    return false;
  }
  for (card in hand) {
    if (hand[card].play != "drop" && cards.valueOf(card).suit === cards.valueOf(leadCard).suit) {
      return true;
    }
  }
}

function determineLeaderAndNextTurn(game, gamePlayer, play, gameMetadata, gamePlayerMetadata, playMetadata, callback) {
  game.gamePlayers({where: {status: "ready"}}, function(err, activeGamePlayers) {
    var currentPlayedCard = cards.valueOf(playMetadata.cards.value[0]);
    if (!gameMetadata.leadCard.value
        || currentPlayedCard.beats(cards.valueOf(gameMetadata.leadCard.value))
        || gameMetadata.leadGamePlayer.value === gamePlayer.pk) {
      var previousLeadGamePlayerPk = gameMetadata.leadGamePlayer.value;
      gameMetadata.leadGamePlayer.value = gamePlayer.pk;
      gameMetadata.leadCard.value = playMetadata.cards.value[0];
      updateWinStack(
          previousLeadGamePlayerPk,
          gamePlayer.pk,
          gamePlayerMetadata.winStacks,
          game.session,
          currentPlayedCard);
    }
    var roundComplete = (gameMetadata.cardsLeftToPlay.value % activeGamePlayers.length == 0);
    if (!roundComplete) {
      for (var i = 0; i < activeGamePlayers.length; i++) {
        if (activeGamePlayers[i].id == gamePlayer.id) {
          var nextIndex = (i + 1) < activeGamePlayers.length ? (i + 1) : 0;
          gameMetadata.turnGamePlayer.value = activeGamePlayers[nextIndex].pk;
          break;
        }
      }
    } else {
      gameMetadata.turnGamePlayer.value = gameMetadata.leadGamePlayer.value;
    }
    callback();
  });
}

function processSessionOver(session, game, gameMetadata, callback) {
  if (gameMetadata.cardsLeftToPlay.value == 0) {
    game.status = "undealt";
    game.save();
    models.findEntityByPk(gameMetadata.leadGamePlayer.value, models.GamePlayer, function(err, leadGamePlayer) {
      leadGamePlayer.getMetadata(["winStacks", "score", "won", "hands"], function(err, gamePlayerMetadata) {
        var winStack = gamePlayerMetadata.winStacks.value[session];
        var score = 0;
        for (var i = 0; i < winStack.length; i++) {
          var dropInfo = gamePlayerMetadata.hands.value[session][winStack[i]];
          score += pointsMap[cards.valueOf(winStack[i]).rank.name][dropInfo.modifier];
        }
        score = score || 1;
        gamePlayerMetadata.score.value += score;
        gamePlayerMetadata.score.save();
        gamePlayerMetadata.won.value += 1;
        gamePlayerMetadata.won.save();
        callback(true, gamePlayerMetadata.score.value);
      }, /* retrieveDbObject */ true);
    });
  } else {
    callback(false, 0);
  }
}

function updateWinStack(previousLeadGamePlayerPk, currentGamePlayerPk, winStacks, session, currentPlayedCard) {
  /*
   * If last card in winStack is over 7
   *   reset winStack
   * else
   *   if currentPlayedCard is over 7
   *     reset winStack
   * append to winStack
   */
  //If current player is not the lead player. Clear win stack.
  if (previousLeadGamePlayerPk != currentGamePlayerPk) {
    winStacks.value[session] = [];
  }
  var currentPlayedRank = currentPlayedCard.rank.value;
  if (currentPlayedRank > 7) {
    winStacks.value[session] = [];
  } else {
	   winStacks.value[session].push(currentPlayedCard.fileFormat());
  }
  winStacks.save();
}