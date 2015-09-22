var socketio = require('socket.io')
  , passportSocketIo = require("passport.socketio");

function handle(server, cookieParser, sessionStore, sessionSecret) {
  var io = socketio.listen(server);
  
  io.use(passportSocketIo.authorize({
    cookieParser: cookieParser,       // the same middleware you registrer in express
    key:          'express.sid',       // the name of the cookie where express/connect stores its session_id
    secret:       sessionSecret,    // the session_secret to parse the cookie
    store:        sessionStore,        // we NEED to use a sessionstore. no memorystore please
    success:      onAuthorizeSuccess,  // *optional* callback on success - read more below
    fail:         onAuthorizeFail,     // *optional* callback on fail/error - read more below
  }));
  
  io.sockets.on('connection', function (socket){
    var userList = passportSocketIo.filterSocketsByUser(io, function(user){
      return user.id === socket.request.user.id;
    });
    
    socket.on('message', function (message) {
      console.log('Got message: ', message);
      socket.broadcast.emit('message', message);
    });
  });
  
  return io;
}

function onAuthorizeSuccess(data, accept){
  accept();
}

function onAuthorizeFail(data, message, error, accept){
  accept(new Error(message));
}

exports.handle = handle;
