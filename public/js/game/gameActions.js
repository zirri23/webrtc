socket.emit('set game', {
  game: '{{ game.pk }}',
  gamePlayer: '{{ gamePlayer.pk }}',
  player: '{{ player.pk }}',
  name: '{{ player.name }}',
  remoteAvatar: '{{ player.remoteAvatar }}' || DEFAULT_PROFILE_PIC});

window.maxZIndex = 0;
window.game = {{ game|json|raw }};
window.gamePlayerPkToGamePlayer = {};
window.boxIdToFace = {};
window.gamePlayerIdToBoxId = {};

for (var i = 0; i < game.gamePlayers.length; i++) {
  var gamePlayer = game.gamePlayers[i];
  gamePlayer.complete = true;
  gamePlayerPkToGamePlayer[gamePlayer.pk] = gamePlayer;
}

arrangePlayers();
processDrops();
getCards(game.session);

$("#drop").append($("#board"));
if (game.status === "undealt" && game.dealer === "{{ gamePlayer.pk }}") {
  showDealButton();
}
updateGameStatus(game.turnGamePlayer, game.leadGamePlayer, game.dealer, game.leadCard);

function updateGameStatus(turnGamePlayer, leadGamePlayer, dealer, leadCard, isSessionOver, score) {
  if (isSessionOver && score) {
    var currentWon = parseInt($(sprintf("#%s", leadGamePlayer)).find(".won").text() || 0);
    updateScores($(sprintf("#%s", leadGamePlayer)), score, null, true);
  }
  if (isSessionOver && dealer === "{{ gamePlayer.pk }}") {
    showDealButton();
  }
  $(".lead-card").hide();
  $(".turn-card").hide();
  $(sprintf("#%s", leadGamePlayer || turnGamePlayer)).find(".lead-card").show("slow");
  $(sprintf("#%s", turnGamePlayer)).find(".turn-card").show("slow");
}

function processDrops() {
  $(".player-drop-cards").children().fadeOut();
  $(".player-drop-holder").animate().css("visibility", "hidden");
  for (var i = 0; i < game.plays.length; i++) {
    var play = game.plays[i];
    if (play.type === "drop") {
      var gamePlayer = gamePlayerPkToGamePlayer[play.gamePlayerPk];
      processDrop(play.gamePlayerPk, gamePlayer.player.remoteAvatar || DEFAULT_PROFILE_PIC, play.cards);
    }
  }
}

function showDealButton() {
  $("deal-button").removeAttr('disabled');
  $("#deal-button").show("slow");
  $("#deal-button").click(function(){
    $("deal-button").attr('disabled','disabled');
    $.post("/sendPlay/", {
      _csrf: '{{ csrfToken }}',
      gamePk: game.pk,
      gamePlayerPk: "{{ gamePlayer.pk }}",
      type: "deal",
      metadata: [],
      name: '{{ player.name }}',
      remoteAvatar: '{{ player.remoteAvatar }}'})
     .success(function(data) {
       $("#deal-button").fadeOut("slow");
     })
     .error(function(err){
       alert(err.responseText);
     });
  });
}

function arrangePlayers() {
  if($("#hand").find(".hand-avatar").length == 0) {
    var playerBox = $("#playerBox").clone();
    playerBox.attr("id", "{{ gamePlayer.pk }}");
    playerBox.find(".avatar").attr("src", "{{ player.remoteAvatar }}" || DEFAULT_PROFILE_PIC);
    updateScoresOnLoad(playerBox, "{{ gamePlayer.score }}", "{{ gamePlayer.won }}");
    $("#hand").append(playerBox);
  }
  
  var count = 1;
  var playerCount = Object.keys(gamePlayerPkToGamePlayer).length;
  for (gamePlayerPk in gamePlayerPkToGamePlayer) {
    var gamePlayer = gamePlayerPkToGamePlayer[gamePlayerPk];
    if(gamePlayer.pk != "{{ gamePlayer.pk }}") {
      $(sprintf(".%splayer%s-drops", playerCount, count))
          .find(".player-drop-holder")
              .attr("id", sprintf("%s-drops", gamePlayerPk));
      var position = sprintf("%splayer%s", playerCount, count);
      count++;
      var positionBox = $(sprintf(".%s", position));
      var positionBoxId = positionBox.attr("id");
      // Remove old box
      if (boxIdToFace.hasOwnProperty(gamePlayerIdToBoxId[gamePlayerPk])) {
        var oldPositionBox = $(sprintf("#%s", gamePlayerIdToBoxId[gamePlayerPk]));
        flipPlayerBox(oldPositionBox, gamePlayerIdToBoxId[gamePlayerPk]);
      }
      var playerBox = $("#playerBox").clone();
      playerBox.attr("id", gamePlayerPk);
      playerBox.find(".avatar").attr("src", gamePlayer.player.remoteAvatar || DEFAULT_PROFILE_PIC);
      
      updateScoresOnLoad(playerBox, gamePlayer.score, gamePlayer.won);
      
      flipPlayerBox(positionBox, positionBoxId, playerBox);
      gamePlayerIdToBoxId[gamePlayerPk] = positionBoxId;
    }
    if (game.status === "dealt" && gamePlayer.status === "active") {
      $(sprintf("#%s", gamePlayer.pk)).find(".readyButton").addClass("not-ready");
      if(gamePlayer.pk == "{{ gamePlayer.pk }}") {
        $("#{{ gamePlayer.pk }}").find(".readyButton").addClass("player-not-ready");
      }
    } else {
      $(sprintf("#%s", gamePlayer.pk)).find(".readyButton").removeClass("not-ready");
      $(sprintf("#%s", gamePlayer.pk)).find(".readyButton").removeClass("player-not-ready");
    }
  }
}

function updateScores(playerBox, score, won, incrementWon) {
  var a = playerBox.find(".score-card")[0];
  var svgDoc = a.contentDocument;
  svgDoc.getElementById("score").textContent = (score || 0);
  if (incrementWon) {
    var currentWon = parseInt(svgDoc.getElementById("games").textContent);
    svgDoc.getElementById("games").textContent = ++currentWon;
  } else {
    svgDoc.getElementById("games").textContent = (won || 0);
  }
}

function updateScoresOnLoad(playerBox, score, won, incrementWon) {
  var a = playerBox.find(".score-card")[0];
  a.addEventListener("load", function(){
    updateScores(playerBox, score, won, incrementWon);
  },false);
}

function flipPlayerBox(positionBox, positionBoxId, newPlayer) {
  var oldFace = boxIdToFace[positionBoxId];
  if (oldFace == "back") {
    newFace = "front";
  } else {
    newFace = "back";
  }
  flip(oldFace, positionBox, newPlayer);
  boxIdToFace[positionBoxId] = newFace;
}

function flip(oldFace, container, newData) {
  if (oldFace == "back") {
    newFace = "front";
  } else {
    newFace = "back";
  }
  container.find(sprintf(".%s", newFace)).html("");
  container.find(sprintf(".%s", oldFace)).html("");
  if (newData != undefined) {
    container.find(sprintf(".%s", newFace)).append(newData);
  }
  container.removeClass(sprintf("flip-container-%s", oldFace));
  container.addClass(sprintf("flip-container-%s", newFace));
}

function getCards(session) {
  $.post("/getCards/", {
    _csrf: '{{ csrfToken }}',
    gamePlayerPk: "{{ gamePlayer.pk }}",
    gamePk: "{{ game.pk }}",
    session: session})
   .success(function(hands){
     $(".dry-badge").hide();
     
     for (var h = 0; h < hands.length; h++) {
       var cards = hands[h].hand;
       for (card in cards) {
         var cardHolderBox = $(sprintf("#%s", hands[h].gamePlayer)).find($(sprintf(".card%s", cards[card].index)));
         var cardHolder = cardHolderBox.find("img");
         if (cards[card].play == "unplayed") {
           cardHolder.attr("src", "/img/cards/svg/back.svg");
           if (hands[h].gamePlayer === "{{ gamePlayer.pk }}" || cards[card].modifier === "show-dry") {
             cardHolder.attr("src", sprintf("/img/cards/svg/%s.svg", card));
           }
           cardHolder.attr("name", card);
           cardHolder.parent().fadeIn("slow");
           cardHolderBox.find(sprintf(".%s", cards[card].modifier)).show("fast");
         } else {
           cardHolder.parent().hide("fast");
         }
       }
     }
   })
   .error(function(err){
     alert(err.responseText);
   });
}


$(".player-card").drags({revert: true});

$(".play-action").drops({
  accept: ".player-card",
  hoverClass: "play-action-hilighted",
  drop: function() {
    $.post("/sendPlay/", {
      _csrf: '{{ csrfToken }}',
      gamePk: game.pk,
      gamePlayerPk: "{{ gamePlayer.pk }}",
      type: window.droppable.attr("id"),
      metadata: [{key: 'cards', value: [window.draggable.find("img").attr("name")]}],
      name: '{{ player.name }}',
      remoteAvatar: '{{ player.remoteAvatar }}' || DEFAULT_PROFILE_PIC})
      .error(function(err){
        console.log(err);
        alert(err.responseText);
      });
  }});

$("#textInput").keypress(
 function(event) {
   var message = $("#textInput").text();
   var keycode = (event.keyCode ? event.keyCode
     : (event.which ? event.which : event.charCode));
   if (keycode == 13) {
    event.preventDefault();
    
    $.post("/sendChatMessage/", {
      _csrf: '{{ csrfToken }}',
      gamePk: game.pk,
      gamePlayerPk: "{{ gamePlayer.pk }}",
      message: message,
      name: '{{ player.name }}',
      remoteAvatar: '{{ player.remoteAvatar }}' || DEFAULT_PROFILE_PIC})
     .error(function(err) {
       alert(err.responseText);
     })
     .success(function(data) {
       $('#messages').animate({
         scrollTop: $('#messages').get(0).scrollHeight }, 500);
       $("#textInput").text("");
     });
  }
 });

function processDrop(gamePlayerPk, remoteAvatar, cards) {
  for (var i = 0; i < cards.length; i++) {
    $(sprintf("#%s", gamePlayerPk)).find(sprintf(".card%s", cards[i].index)).hide("fast");
    var cardImage = $("#drop-card").clone();
    cardImage.removeAttr("id");
    cardImage.attr("src", sprintf("img/cards/svg/%s.svg", cards[i].card || cards[i]));
    cardImage.css("z-index", ++maxZIndex);
    cardImage.css("-webkit-transform", sprintf("rotateZ(%sdeg)", getRandom(20)));
    
    var dropHolder = $(sprintf("#%s-drops", gamePlayerPk));
    dropHolder.find(".player-drop-cards").append(cardImage);
    dropHolder.find(".board-pic").attr("src", remoteAvatar);
    dropHolder.animate().css("visibility", "visible");
    cardImage.draggable();
  }
}

function processDry(gamePlayerPk, remoteAvatar, cards, playType) {
  for (var i = 0; i < cards.length; i++) {
    var cardHolder = $(sprintf("#%s", gamePlayerPk)).find(sprintf(".card%s", cards[i].index));
    cardHolder.find(sprintf(".%s", playType)).show("fast");
    if (cards[i].card) {
      cardHolder.find("img").attr("src", sprintf("img/cards/svg/%s.svg", cards[i].card));
    }
  }
}

function processReady(gamePlayerPk, remoteAvatar, cards, playType) {
  $(sprintf("#%s", gamePlayerPk)).find(".readyButton").removeClass("not-ready");
}


$("#{{ gamePlayer.pk }}").find(".readyButton").click(function() {
  if (!$(this).hasClass("player-not-ready")) {
    return;
  }
  $.post("/sendPlay/", {
    _csrf: '{{ csrfToken }}',
    gamePk: game.pk,
    gamePlayerPk: "{{ gamePlayer.pk }}",
    type: "ready",
    name: '{{ player.name }}',
    remoteAvatar: '{{ player.remoteAvatar }}' || DEFAULT_PROFILE_PIC})
    .error(function(err){
      console.log(err);
      alert(err.responseText);
    });
});