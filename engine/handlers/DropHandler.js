var util = require('util');
var cards = require('../cards');

var pointsMap = {
  6    : {null: 3, "dry": 6, "show-dry": 12},
  7    : {null: 2, "dry": 4, "show-dry": 8},
  other: {null: 1, "dry": 1, "show-dry": 1}
};

exports.DropHandler = {
  handlePlay: function(play, game, gamePlayer, models, t, callback) {
    var gameMetadata = game.getAllMetadata();
    if (gameMetadata.status != "ready") {
      callback("Can't play until everyone is ready", {});
      return;
    }
    var gamePlayerPk = gamePlayer.get("uuid");
    if (gameMetadata.turnGamePlayer != gamePlayerPk) {
      callback("Not your turn", {});
      return;
    }
    var session = gameMetadata.session;
    var gamePlayerMetadata = gamePlayer.getAllMetadata();
    var hand = gamePlayerMetadata["hands"][session];
    var playMetadata = play.getAllMetadata();

    var firstCard = playMetadata.cards[0];
    var cardInHand = hand.find(function(card) {return firstCard == card.card});
    if (cardInHand == null || cardInHand == undefined) {
      callback("You don't have that card anymore!", {});
      return;
    }
    if (isGbaa(
            gameMetadata.leadGamePlayer,
            gamePlayerPk,
            firstCard,
            gameMetadata.leadCard,
            hand)) {
      callback(util.format("You must play a card of suit %s", cards.valueOf(gameMetadata.leadCard).suit), {});
      return;
    }
    var playedCards = [];
    playMetadata.cards.map(function(card) {playedCards.push({card: card, index: hand.indexOf(cardInHand)})});

    cardInHand.play = play.getMetadata("type");

    var activeGamePlayers = game.related("gamePlayers").filter(function(gamePlayer) {
      return gamePlayer.getMetadata("status") === "ready";
    });

    determineLeaderAndNextTurn(activeGamePlayers, gamePlayerPk, gameMetadata, cardInHand.card);
    var sessionComplete = isSessionComplete(isRoundComplete(gamePlayerPk, activeGamePlayers, session), hand);
    var leadGamePlayer = processScores(session, game, gameMetadata, activeGamePlayers, sessionComplete);

    game.setAllMetadata(gameMetadata);
    gamePlayer.setAllMetadata(gamePlayerMetadata);

    var saveGame = game.save(null, {transacting: t});
    var saveGamePlayer = saveGame.then(function(game) {
      return gamePlayer.save("metadata", JSON.stringify(gamePlayerMetadata), {transacting: t, patch: true});
    });
    var saveLeadGamePlayer = saveGamePlayer.then(function(gamePlayer) {
      leadGamePlayer.save(null, {transacting: t}).then(function(g) {
        callback("", {
          isSessionOver: sessionComplete,
          score: leadGamePlayer.getMetadata("score"),
          playType: play.getMetadata("type"),
          cards: playedCards,
          leadCard: gameMetadata.leadCard,
          leadGamePlayer: gameMetadata.leadGamePlayer,
          turnGamePlayer: gameMetadata.turnGamePlayer,
          dealer: gameMetadata.dealer
        });
      });
    });
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
  for (var i = 0; i < hand.length; i++) {
    var card = hand[i];
    if (card.play !== "drop" && cards.valueOf(card.card).suit === cards.valueOf(leadCard).suit) {
      return true;
    }
  }
  return false;
}

function determineLeaderAndNextTurn(activeGamePlayers, gamePlayerPk, gameMetadata, currentPlayedCard) {
  if (!gameMetadata.leadCard
      || cards.valueOf(currentPlayedCard).beats(cards.valueOf(gameMetadata.leadCard))
      || gameMetadata.leadGamePlayer === gamePlayerPk) {
    var previousLeadGamePlayerPk = gameMetadata.leadGamePlayer;
    gameMetadata.leadGamePlayer = gamePlayerPk;
    gameMetadata.leadCard = currentPlayedCard;
  }
  var roundComplete = isRoundComplete(gamePlayerPk, activeGamePlayers, gameMetadata.session);
  if (!roundComplete) {
    var gamePlayerIndex = activeGamePlayers.findIndex(function(gp) {return gp.get("uuid") === gamePlayerPk});
    var nextIndex = (gamePlayerIndex + 1) % activeGamePlayers.length;
    gameMetadata.turnGamePlayer = activeGamePlayers[nextIndex].get("uuid");
  } else {
    gameMetadata.turnGamePlayer = gameMetadata.leadGamePlayer;
  }
}

function isRoundComplete(gamePlayerPk, activeGamePlayers, session) {
  var played = null;
  for (var i = 0; i < activeGamePlayers.length; i++) {
    var gamePlayer = activeGamePlayers[i];
    if (gamePlayer.get("uuid") !== gamePlayerPk) {
      var playCount = 0;
      var gamePlayerMetadata = gamePlayer.getAllMetadata();
      var hand = gamePlayerMetadata["hands"][session];
      hand.forEach(function(card) {
        if (card.played) {
          playCount++
        }
      });
      if (playCount != (played || playCount)) {
        return false;
      }
    }
  }
  return true;
}

function isSessionComplete(isRoundComplete, hand) {
  if (!isRoundComplete) {
    return false;
  }
  for (var card in hand) {
    if (card.play !== "drop") {
      return false;
    }
  }
  return true;
}

function processScores(session, game, gameMetadata, gamePlayers, sessionComplete) {
  var leadGamePlayer = gamePlayers.find(function(g) {return g.get("uuid") === gameMetadata["leadGamePlayer"]});

  if (sessionComplete) {
    gameMetadata.status = "undealt";
    var gamePlayerMetadata = leadGamePlayer.getAllMetadata();
    var leadPlays = game.related("plays").filter(function(play) {
      return play.getMetadata("session") == session && play.get("game_player_uuid") === leadGamePlayer.get("uuid");
    }).sort(function(a, b) {
      return a.get("created_at").getTime() - b.get("created_at").getTime();
    });

    var score = 0;
    var leadPlay = leadPlays[leadPlays.length - 1];
    while (cards.valueOf(leadPlay.getMetadata("card")).rank.value <= 7) {
      if (leadPlays[leadPlays.length - 1])
      score += pointsMap[leadCard.rank.name][leadPlay.modifier];
    }

    score = score || 1;
    gamePlayerMetadata.score += score;
    gamePlayerMetadata.won += 1;
    leadGamePlayer.setAllMetadata(gamePlayerMetadata);
  }
  return leadGamePlayer;
}