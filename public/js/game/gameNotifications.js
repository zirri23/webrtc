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

socket.on(sprintf("drop/%s", "{{ game.uuid }}"), function(message) {
  alert
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
