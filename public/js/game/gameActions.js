window.gamePlayerId = "{{ gamePlayer.uuid }}";
window.gamePlayerSaturations = {};

socket.emit("set game", {
  game: "{{ game.uuid }}",
  gamePlayer: "{{ gamePlayer.uuid }}",
  player: "{{ player.uuid }}",
  name: "{{ player.name }}",
  avatar: "{{ player.avatar }}" || DEFAULT_PROFILE_PIC});

window.maxZIndex = 0;

window.game = {{ game|json|raw }};
window.gamePlayerPkToGamePlayer = {};
window.boxIdToFace = {};
window.gamePlayerIdToBoxId = {};
window.gamePlayerIdToHandAvatars = {};
for (var i = 0; i < game.gamePlayers.length; i++) {

  var gamePlayer = game.gamePlayers[i];
  gamePlayer.complete = true;
  gamePlayerPkToGamePlayer[gamePlayer.uuid] = gamePlayer;
}
var versionChecker = setInterval(function() {
  $.post("/getGameVersion/", {
    _csrf: "{{ csrfToken }}",
    gamePlayerPk: "{{ gamePlayer.uuid }}",
    gamePk: "{{ game.uuid }}",
  })
  .success(function(data) {
    if (data.version > window.game.version) {
      alert("updating game version from: " + window.game.version + "to: " + data.version);
      console.log("forced refresh");

      $.post("/getGame/", {
        _csrf: "{{ csrfToken }}",
        gamePlayerPk: "{{ gamePlayer.uuid }}",
        gamePk: "{{ game.uuid }}"})
      .success(function(game){
        window.game = game;
        updateGameStatus(game.turnGamePlayer, game.leadGamePlayer, game.dealer, game.leadCard);
        arrangePlayers();
        processDrops();
        window.game.version = data.version;
      })
      .error(function(err){
        alert(err.responseText);
      });
    }
  })
  .error(function(err) {
    clearInterval(versionChecker);
    console.log(err);
  })
}, 5000);

arrangePlayers();
processDrops();
getCards(game.session);
$("#drop").append($("#board"));

if (game.status === "undealt" && game.dealer === "{{ gamePlayer.uuid }}") {
  showDealButton();
}
updateGameStatus(game.turnGamePlayer, game.leadGamePlayer, game.dealer, game.leadCard);

function updateGameStatus(turnGamePlayer, leadGamePlayer, dealer, leadCard, isSessionOver, score) {
  if (isSessionOver && score) {
    var currentWon = parseInt($(sprintf("#%s", leadGamePlayer)).find(".won").text() || 0);
    updateScores($(sprintf("#%s", leadGamePlayer)), score, null, true);
  }
  if (isSessionOver && dealer === "{{ gamePlayer.uuid }}") {
    showDealButton();
  }
  $(".lead-card").hide();
  $(".turn-card").hide();
  $(sprintf("#%s", leadGamePlayer)).find(".lead-card").show("slow");
  $(sprintf("#%s", turnGamePlayer)).find(".turn-card").show("slow");
}

function processDrops() {
  $(".player-drop-cards").children().fadeOut();
  $(".player-drop-holder").animate().css("visibility", "hidden");
  for (var i = 0; i < game.plays.length; i++) {
    var play = game.plays[i];
    if (play.type === "drop" && play.session == game.session) {
      var gamePlayer = gamePlayerPkToGamePlayer[play.game_player_uuid];
      processDrop(play.game_player_uuid, gamePlayer.player.avatar || DEFAULT_PROFILE_PIC, play.cards);
    }
  }
}

function showDealButton() {
  $("deal-button").removeAttr("disabled");
  $("#deal-button").css("z-index", ++maxZIndex);
  $("#deal-button").show("slow");
  $("#deal-button").click(function(){
    $("deal-button").attr("disabled","disabled");
    $.post("/sendPlay/", {
      _csrf: "{{ csrfToken }}",
      gamePk: game.uuid,
      gamePlayerPk: "{{ gamePlayer.uuid }}",
      type: "deal",
      metadata: [],
      name: "{{ player.name }}",
      avatar: "{{ player.avatar }}"})
     .success(function(data) {
       $("#deal-button").fadeOut("slow");
     })
     .error(function(err){
       sendPlayToChat({sender: "Moderator", type: err.responseText, time: new Date().getTime()});
     });
  });
}

function arrangePlayers() {
  if($("#hand").find(".hand-avatar").length == 0) {
    var playerBox = $("#playerBox").clone();
    playerBox.attr("id", "{{ gamePlayer.uuid }}");
    $("#hand").append(playerBox);
    playerBox = $("#{{ gamePlayer.uuid }}");
    playerBox.find(".avatar").attr("src", "{{ player.avatar }}" || DEFAULT_PROFILE_PIC);
    updateScoresOnLoad(playerBox, "{{ gamePlayer.score }}", "{{ gamePlayer.won }}");
  }
  var count = 1;

  var playerCount = Object.keys(gamePlayerPkToGamePlayer).length;
  $(sprintf(".%splayer%s-drops", playerCount, playerCount))
      .find(".player-drop-holder")
      .attr("id", sprintf("%s-drops", "{{ gamePlayer.uuid }}"));


  for (var gamePlayerPk in gamePlayerPkToGamePlayer) {
    var gamePlayer = gamePlayerPkToGamePlayer[gamePlayerPk];
    if(gamePlayer.uuid != "{{ gamePlayer.uuid }}") {
      $(sprintf(".%splayer%s-drops", playerCount, count))
          .find(".player-drop-holder")
              .attr("id", sprintf("%s-drops", gamePlayerPk));
      var position = sprintf("%splayer%s", playerCount, count);
      count++;
      var positionBox = $(sprintf(".%s", position));
      var positionBoxId = positionBox.attr("id");
      if (boxIdToFace.hasOwnProperty(gamePlayerIdToBoxId[gamePlayerPk])) {
        var oldPositionBox = $(sprintf("#%s", gamePlayerIdToBoxId[gamePlayerPk]));
        flipPlayerBox(oldPositionBox, gamePlayerIdToBoxId[gamePlayerPk]);
      }
      var playerBox = $("#playerBox").clone();
      playerBox.attr("id", gamePlayerPk);
      playerBox.find(".avatar").attr("src", gamePlayer.player.avatar || DEFAULT_PROFILE_PIC);
      updateScoresOnLoad(playerBox, gamePlayer.score, gamePlayer.won);

      flipPlayerBox(positionBox, positionBoxId, playerBox);

      gamePlayerIdToBoxId[gamePlayerPk] = positionBoxId;
    }
    if (game.status === "dealt" && gamePlayer.status === "active") {
      $(sprintf("#%s", gamePlayer.uuid)).find(".readyButton").addClass("not-ready");
      if(gamePlayer.uuid == "{{ gamePlayer.uuid }}") {
        $("#{{ gamePlayer.uuid }}").find(".readyButton").addClass("player-not-ready");
      }
      greyOutPlayerVideo(gamePlayer.uuid);
    } else {
      $(sprintf("#%s", gamePlayer.uuid)).find(".readyButton").removeClass("not-ready");
      $(sprintf("#%s", gamePlayer.uuid)).find(".readyButton").removeClass("player-not-ready");
      unGreyOutPlayerVideo(gamePlayer.uuid);
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
    _csrf: "{{ csrfToken }}",
    gamePlayerPk: "{{ gamePlayer.uuid }}",
    gamePk: "{{ game.uuid }}",
    session: session})
   .success(function(hands){
     $(".dry-badge").hide();
     for (var gamePlayer in hands) {
       var hand = hands[gamePlayer];
       for (var i = 0; i < Object.keys(hand).length; i++) {
         var card = hand[i];
         var cardHolderBox = $(sprintf("#%s", gamePlayer)).find($(sprintf(".card%s", i + 1)));
         var cardHolder = cardHolderBox.find("img");
         if (card.play == "unplayed") {
           cardHolder.attr("src", "/img/cards/svg/back.svg");
           if (gamePlayer === "{{ gamePlayer.uuid }}" || card.modifier === "show-dry") {
             cardHolder.attr("src", sprintf("/img/cards/svg/%s.svg", card.card));
           }
           cardHolder.attr("name", card.card);
           cardHolder.parent().fadeIn("slow");
           cardHolderBox.find(sprintf(".%s", card.modifier)).show("fast");
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
      _csrf: "{{ csrfToken }}",
      gamePk: game.uuid,
      gamePlayerPk: "{{ gamePlayer.uuid }}",
      type: window.droppable.attr("id"),
      metadata: {"cards": [window.draggable.find("img").attr("name")]},
      name: "{{ player.name }}",
      avatar: "{{ player.avatar }}" || DEFAULT_PROFILE_PIC})
      .error(function(err){
        console.log(err);
        sendPlayToChat({sender: "Moderator", type: err.responseText, time: new Date().getTime()});
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
      _csrf: "{{ csrfToken }}",
      gamePk: game.uuid,
      gamePlayerPk: "{{ gamePlayer.uuid }}",
      message: message,
      name: "{{ player.name }}",
      avatar: "{{ player.avatar }}" || DEFAULT_PROFILE_PIC})
     .error(function(err) {
       alert(err.responseText);
     })
     .success(function(data) {
       $("#messages").animate({
         scrollTop: $("#messages").get(0).scrollHeight }, 500);
       $("#textInput").text("");
     });
  }
 });


function processDrop(gamePlayerPk, avatar, cards) {
  for (var i = 0; i < cards.length; i++) {
    $(sprintf("#%s", gamePlayerPk)).find(sprintf(".card%s", cards[i].index + 1)).hide("fast");
    var cardImage = $("#drop-card").clone();
    cardImage.removeAttr("id");
    cardImage.attr("src", sprintf("img/cards/svg/%s.svg", cards[i].card));
    cardImage.css("z-index", ++maxZIndex);
    cardImage.css("-webkit-transform", sprintf("rotateZ(%sdeg)", getRandom(20)));
    var dropHolder = $(sprintf("#%s-drops", gamePlayerPk));

    dropHolder.find(".player-drop-cards").append(cardImage);
    dropHolder.find(".board-pic").attr("src", avatar);
    dropHolder.animate().css("visibility", "visible");
    cardImage.draggable();
  }
}

function processDry(gamePlayerPk, avatar, cards, playType) {
  for (var i = 0; i < cards.length; i++) {
    var cardHolder = $(sprintf("#%s", gamePlayerPk)).find(sprintf(".card%s", cards[i].index + 1));
    cardHolder.find(sprintf(".%s", playType)).show("fast");
    if (cards[i].card) {
      cardHolder.find("img").attr("src", sprintf("img/cards/svg/%s.svg", cards[i].card));
    }
  }
}

function processReady(gamePlayerPk, avatar, cards, playType) {
  $(sprintf("#%s", gamePlayerPk)).find(".readyButton").removeClass("not-ready");
  $(sprintf("#%s", gamePlayerPk)).find(".readyButton").removeClass("player-not-ready");
  gamePlayerPkToGamePlayer[gamePlayerPk].status = "ready";
  unGreyOutPlayerVideo(gamePlayerPk);
}
$("#{{ gamePlayer.uuid }}").find(".readyButton").click(function() {
  if (!$(this).hasClass("player-not-ready")) {
    if ($("#local").length) {
      window.peer.destroy();
      $("#local-div").replaceWith(window.avatarImage);
    } else {
      setupVideo();
    }
    return;
  }
  $.post("/sendPlay/", {
    _csrf: "{{ csrfToken }}",
    gamePk: game.uuid,
    gamePlayerPk: "{{ gamePlayer.uuid }}",
    type: "ready",
    name: "{{ player.name }}",
    avatar: "{{ player.avatar }}" || DEFAULT_PROFILE_PIC})
    .error(function(err){
      console.log(err);
      alert(err.responseText);
    });
});

function setupVideo() {
  window.peer = new Peer(window.gamePlayerId, {host: 'spargame.com', port: 8001});
  peer.on('open', function(id) {
    console.log('My peer ID is: ' + id);
  });
  var handAvatar = $("#{{ gamePlayer.uuid }}").find(".hand-avatar");
  window.avatarImage = handAvatar;
  var videoDiv = $("#video-div").clone();
  videoDiv.attr("id", "local-div");
  var playerVideo = videoDiv.find("#player-video");
  playerVideo.attr("id", "local");
  var playerVideoCanvas = videoDiv.find("#player-video-canvas");
  playerVideoCanvas.attr("id", "local-canvas");

  handAvatar.replaceWith(videoDiv);
  createStream(function(stream) {
    // get local stream for manipulation
    window.playerStream = stream;
    attachStream(stream, 'local', "{{ gamePlayer.uuid }}");

    for (var gamePlayerPk in gamePlayerPkToGamePlayer) {
      if (gamePlayerPk !== "{{ gamePlayer.uuid }}") {
        !function outer(gamePlayerPk) {
          peer.on('call', function(call) {
            // Answer the call, providing our mediaStream
            call.answer(stream);
            console.log("Sending stream to: " + call.peer);
            showPeerVideo(call);
          });
          var call = peer.call(gamePlayerPk, stream);
          if (call) {
            showPeerVideo(call);
          }
        }(gamePlayerPk);
      }
    }
  });
}

function showPeerVideo(call) {
  call.on('stream', function (stream) {
    var gamePlayerPk = call.peer;
    var videoId = "remote-" + gamePlayerPk;
    console.log("receiving stream from: " + videoId);

    var videoDiv = $("#video-div").clone();
    videoDiv.attr("id", videoId + "-div");
    var videoCanvas = videoDiv.find("#player-video-canvas");
    videoCanvas.attr("id", videoId + "-canvas");
    var video = videoDiv.find("#player-video");
    video.attr("id", videoId);

    var handAvatar = $(sprintf("#%s", gamePlayerPk)).find(".hand-avatar");
    if (handAvatar.length) {
      window.gamePlayerIdToHandAvatars[gamePlayerPk] = handAvatar;
      handAvatar.replaceWith(videoDiv);
      // `stream` is the MediaStream of the remote peer.
      // Here you'd add it to an HTML video/canvas element.
      attachStream(stream, videoId, call.peer);
    }
  });

  call.on('close', function() {
    var gamePlayerPk = call.peer;
    var videoId = "remote-" + gamePlayerPk;
    console.log(sprintf("Got disc for %s my gamePlayerPk is {{ gamePlayer.uuid }}", gamePlayerPk));
    // hide the remote video
    var video = $("#" + videoId + "-div");
    var handAvatar = window.gamePlayerIdToHandAvatars[gamePlayerPk];
    if (handAvatar) {
      video.replaceWith(handAvatar);
    }
  });
}

function greyOutPlayerVideo(gamePlayerPk) {
  if (window.gamePlayerSaturations[gamePlayerPk]) {
    window.gamePlayerSaturations[gamePlayerPk].saturation = -1;
  }
}

function unGreyOutPlayerVideo(gamePlayerPk) {
  if (window.gamePlayerSaturations[gamePlayerPk]) {
    window.gamePlayerSaturations[gamePlayerPk].saturation = 0;
  }
}
