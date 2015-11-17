var getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);

socket.on(sprintf("room change/%s", "{{ game.uuid }}"), function(message) {
  console.log(message.gamePlayer.uuid);
  window.game.version = message.details.version;
  gamePlayerPkToGamePlayer[message.gamePlayer.uuid] = message.gamePlayer;
  arrangePlayers();
});

socket.on(sprintf("chat message/%s", "{{ game.uuid }}"), function(message) {
  var sentByCurrentUser =  (message.senderPk == "{{ gamePlayer.uuid }}");
  var direction = sentByCurrentUser ? "left" : "right";
  var chatBubble = $(sprintf("#%sChat", direction)).clone();
  chatBubble.removeAttr("id");
  chatBubble.find(".chat-text").append(message.text);
  chatBubble.find(".chat-text").emoticons();
  if (!sentByCurrentUser) {
    chatBubble.find(".chat-sender").append(message.sender);
  }
  chatBubble.find(".chat-time").append(new Date(message.time).format("h:MM TT"));
  chatBubble.find(".chat-avatar").attr("src", message.avatar || DEFAULT_PROFILE_PIC);
  $("#messages").append(chatBubble);
  chatBubble.find(".chat-avatar").fadeIn();
  chatBubble.find(".chat-content").show(150);
  $("#messages").animate({
    scrollTop: $("#messages").get(0).scrollHeight}, 500);
});

function sendPlayToChat(message) {
  var sentByCurrentUser =  (message.senderPk == "{{ gamePlayer.uuid }}");
  var direction = sentByCurrentUser ? "left" : "right";
  var chatBubble = $(sprintf("#%sChat", direction)).clone();
  chatBubble.removeAttr("id");
  chatBubble.find(".chat-text").append(message.type);
  chatBubble.find(".chat-text").emoticons();
  if (!sentByCurrentUser) {
    chatBubble.find(".chat-sender").append(message.sender);
  }
  chatBubble.find(".chat-time").append(new Date(message.time).format("h:MM TT"));
  chatBubble.find(".chat-avatar").attr("src", message.avatar || DEFAULT_PROFILE_PIC);
  $("#messages").append(chatBubble);
  chatBubble.find(".chat-avatar").fadeIn();
  chatBubble.find(".chat-content").show(150);
  $("#messages").animate({scrollTop: $("#messages").get(0).scrollHeight}, 500);
}

socket.on(sprintf("deal/%s", "{{ game.uuid }}"), function(message) {
  game.status = "dealt";
  window.game.version = message.details.version;
  for (gamePlayer in gamePlayerPkToGamePlayer) {
    greyOutPlayerVideo(gamePlayer);
    gamePlayerPkToGamePlayer[gamePlayer].status = "active";
  }
  $(".player-drop-cards").children().hide("fast");
  $(".player-drop-holder").animate().css("visibility", "hidden");
  $(".readyButton").addClass("not-ready");
  $("#hand").find(".readyButton").addClass("player-not-ready");
  getCards(message.details.session);
  updateGameStatus(message.details.turnGamePlayer, message.details.turnGamePlayer, message.senderPk);
});

socket.on(sprintf("drop/%s", "{{ game.uuid }}"), function(message) {
  window.game.version = message.details.version;
  processDrop(message.senderPk, message.avatar, message.details.cards);
  updateGameStatus(
      message.details.turnGamePlayer,
      message.details.leadGamePlayer,
      message.details.dealer,
      message.details.leadCard,
      message.details.isSessionOver,
      message.details.score);
});

socket.on(sprintf("dry/%s", "{{ game.uuid }}"), function(message) {
  console.log(message);
  window.game.version = message.details.version;
  processDry(message.senderPk, message.avatar, message.details.cards, message.type);
});

socket.on(sprintf("show-dry/%s", "{{ game.uuid }}"), function(message) {
  console.log(message);
  window.game.version = message.details.version;
  processDry(message.senderPk, message.avatar, message.details.cards, message.type);
});

socket.on(sprintf("ready/%s", "{{ game.uuid }}"), function(message) {
  window.game.version = message.details.version;
  processReady(message.senderPk, message.avatar, message.details.cards, message.type);
  sendPlayToChat(message);
});

function attachStream(stream, element, gamePlayerPk) {
  console.log("Element: " + element);
  if (typeof(element) === "string")
    element = document.getElementById(element);
  if (navigator.mozGetUserMedia) {
    if (rtc.debug) console.log("Attaching media stream");
    element.mozSrcObject = stream;
    element.play();
  } else {
    element.src = URL.createObjectURL(stream);
  }

  var seriously = new Seriously();
  var blackAndWhite = seriously.effect("hue-saturation");
  blackAndWhite.hue = 0;
  var elementId = element.id;
  blackAndWhite.source = seriously.source("#" + elementId);
  var canvas = $('#' + elementId + "-canvas");
  var target = seriously.target("#" + canvas.attr("id"));
  target.source = blackAndWhite;
  seriously.go();
  gamePlayerSaturations[gamePlayerPk] = blackAndWhite;
};

function createStream(onSuccess, onFail) {
  onSuccess = onSuccess || function() {};
  onFail = onFail || function() {};

  var options = {
    video: true,
    audio: true
  };

  if (getUserMedia) {
    getUserMedia.call(navigator, options, function(stream) {
      onSuccess(stream);
    }, function(error) {
      alert("Could not connect stream.");
      onFail(error);
    });
  } else {
    alert('webRTC is not yet supported in this browser.');
  }
};