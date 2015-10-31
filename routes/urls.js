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
      }).catch(function(err) {
        // Expected
      });
    }
  }

  app.get('/auth/google', authRoutes.authenticateGoogle);
  app.get('/auth/google/oauth2callback', authRoutes.authenticateGoogleCallback);
  app.get('/login', withoutTransaction(authRoutes.login));
  app.get('/', ensureLoggedIn('/login'), routes.index);
  app.get('/playGame', ensureLoggedIn('/login'), withTransaction(gameRoutes.playGame));
  app.post('/joinGame', ensureLoggedIn('/login'), withTransaction(gameRoutes.joinGame));
  app.post('/createGame', ensureLoggedIn('/login'), withTransaction(gameRoutes.createGame));
  app.post('/queryGames', ensureLoggedIn('/login'), withoutTransaction(gameRoutes.queryGames));
  app.post('/sendChatMessage', ensureLoggedIn('/login'), withTransaction(gameRoutes.sendChatMessage));
  app.post('/sendPlay', ensureLoggedIn('/login'), withTransaction(gameRoutes.sendPlay));
  app.post('/getCards', ensureLoggedIn('/login'), withTransaction(gameRoutes.getCards));
  app.post('/getGameVersion', withoutTransaction(gameRoutes.getGameVersion));
}

post = function(url, route) {
  app.post(url, ensureLoggedIn('/login'), route);
}

get = function(url, route) {
  app.get(url, ensureLoggedIn('/login'), route);
}

exports.route = route;