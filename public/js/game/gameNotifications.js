socket.on(sprintf("room change/%s", "{{ game.pk }}"), function(message) {
  gamePlayerPkToGamePlayer[message.gamePlayer.pk] = message.gamePlayer;
  arrangePlayers();
});

socket.on(sprintf("chat message/%s", "{{ game.pk }}"), function(message) {
  var sentByCurrentUser =  (message.senderPk == "{{ gamePlayer.pk }}");
  var direction = sentByCurrentUser ? "left" : "right";
  var chatBubble = $(sprintf("#%sChat", direction)).clone();
  chatBubble.removeAttr("id");
  chatBubble.find(".chat-text").append(message.text);
  chatBubble.find(".chat-text").emoticons();
  if (!sentByCurrentUser) {
    chatBubble.find(".chat-sender").append(message.sender);
  }
  chatBubble.find(".chat-time").append(new Date(message.time).format("h:MM TT"));
  chatBubble.find(".chat-avatar").attr("src", message.remoteAvatar || DEFAULT_PROFILE_PIC);
  $("#messages").append(chatBubble);
  chatBubble.find(".chat-avatar").fadeIn();
  chatBubble.find(".chat-content").show(150);
  $("#messages").animate({
    scrollTop: $("#messages").get(0).scrollHeight}, 500);
});

function sendPlayToChat(message) {
  var sentByCurrentUser =  (message.senderPk == "{{ gamePlayer.pk }}");
  var direction = sentByCurrentUser ? "left" : "right";
  var chatBubble = $(sprintf("#%sChat", direction)).clone();
  chatBubble.removeAttr("id");
  chatBubble.find(".chat-text").append(message.type);
  chatBubble.find(".chat-text").emoticons();
  if (!sentByCurrentUser) {
    chatBubble.find(".chat-sender").append(message.sender);
  }
  chatBubble.find(".chat-time").append(new Date(message.time).format("h:MM TT"));
  chatBubble.find(".chat-avatar").attr("src", message.remoteAvatar || DEFAULT_PROFILE_PIC);
  $("#messages").append(chatBubble);
  chatBubble.find(".chat-avatar").fadeIn();
  chatBubble.find(".chat-content").show(150);
  $("#messages").animate({scrollTop: $("#messages").get(0).scrollHeight}, 500);
}

socket.on(sprintf("deal/%s", "{{ game.pk }}"), function(message) {
  game.status = "dealt";
  for (gamePlayer in gamePlayerPkToGamePlayer) {
    gamePlayerPkToGamePlayer[gamePlayer].status = "active";
  }
  $(".player-drop-cards").children().hide("fast");
  $(".player-drop-holder").animate().css("visibility", "hidden");
  $(".readyButton").addClass("not-ready");
  $("#hand").find(".readyButton").addClass("player-not-ready");
  getCards(message.details.session);
  updateGameStatus(message.details.turnGamePlayer, message.details.turnGamePlayer, message.senderPk);
});

socket.on(sprintf("drop/%s", "{{ game.pk }}"), function(message) {
  processDrop(message.senderPk, message.remoteAvatar, message.details.cards);
  updateGameStatus(
      message.details.turnGamePlayer,
      message.details.leadGamePlayer,
      message.details.dealer,
      message.details.leadCard,
      message.details.isSessionOver,
      message.details.score);
});

socket.on(sprintf("dry/%s", "{{ game.pk }}"), function(message) {
  processDry(message.senderPk, message.remoteAvatar, message.details.cards, message.type);
});

socket.on(sprintf("show-dry/%s", "{{ game.pk }}"), function(message) {
  processDry(message.senderPk, message.remoteAvatar, message.details.cards, message.type);
});

socket.on(sprintf("ready/%s", "{{ game.pk }}"), function(message) {
  processReady(message.senderPk, message.remoteAvatar, message.details.cards, message.type);
  sendPlayToChat(message);
});
