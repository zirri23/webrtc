var routes = require('./routes');
var authRoutes = require('./authRoutes');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
var gameRoutes = require('./gameRoutes');


function route(app, Bookshelf, io) {

  function withoutTransaction(callback) {
    return function(req, res) {
      callback(req, res, Bookshelf, io);
    }
  }

  function withTransaction(callback) {
    return function(req, res) {
      Bookshelf.transaction(function(t) {
        callback(req, res, Bookshelf, io, t);
      });
    }
  }

  app.get('/auth/google', authRoutes.authenticateGoogle);
  app.get('/auth/google/oauth2callback', authRoutes.authenticateGoogleCallback);
  app.get('/login', withoutTransaction(authRoutes.login));
  app.get('/', ensureLoggedIn('/login'), routes.index);
  app.get('/playGame', ensureLoggedIn('/login'), withoutTransaction(gameRoutes.playGame));
  app.get('/joinGame', ensureLoggedIn('/login'), withTransaction(gameRoutes.joinGame));
  app.get('/createGame', ensureLoggedIn('/login'), withTransaction(gameRoutes.createGame));
  app.post('/queryGames', ensureLoggedIn('/login'), withoutTransaction(gameRoutes.queryGames));
  app.post('/sendChatMessage', ensureLoggedIn('/login'), withoutTransaction(gameRoutes.sendChatMessage));
  app.post('/sendPlay', ensureLoggedIn('/login'), withTransaction(gameRoutes.sendPlay));
  app.post('/getCards', ensureLoggedIn('/login'), withoutTransaction(gameRoutes.getCards));
}

post = function(url, route) {
  app.post(url, ensureLoggedIn('/login'), route);
}

get = function(url, route) {
  app.get(url, ensureLoggedIn('/login'), route);
}

exports.route = route;