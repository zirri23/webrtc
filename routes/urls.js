var routes = require('./routes');
var authRoutes = require('./authRoutes');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
var gameRoutes = require('./gameRoutes');


function route(app, Bookshelf, io) {

  function withTransaction(callback) {
    return function(req, res) {
      Bookshelf.transaction(function(t) {
        callback(req, res, Bookshelf, io, t);
      });
    }
  }

  routes.setModels(Bookshelf);
  routes.setIo(io);
  app.get('/auth/google', authRoutes.authenticateGoogle);
  app.get('/auth/google/oauth2callback', authRoutes.authenticateGoogleCallback);
  app.get('/login', authRoutes.login);
  app.get('/', ensureLoggedIn('/login'), routes.index);
  app.get('/playGame', ensureLoggedIn('/login'), gameRoutes.playGame);
  app.get('/joinGame', ensureLoggedIn('/login'), gameRoutes.joinGame);
  app.get('/createGame', ensureLoggedIn('/login'), withTransaction(gameRoutes.createGame));
  app.post('/queryGames', ensureLoggedIn('/login'), gameRoutes.queryGames);
  app.post('/sendChatMessage', ensureLoggedIn('/login'), gameRoutes.sendChatMessage);
  app.post('/sendPlay', ensureLoggedIn('/login'), gameRoutes.sendPlay);
}

post = function(url, route) {
  app.post(url, ensureLoggedIn('/login'), route);
}

get = function(url, route) {
  app.get(url, ensureLoggedIn('/login'), route);
}

exports.route = route;