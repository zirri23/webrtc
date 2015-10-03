var routes = require('./routes');
var authRoutes = require('./authRoutes');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
var gameRoutes = require('./gameRoutes');

function route(app, Bookshelf, io) {
  routes.setModels(Bookshelf);
  routes.setIo(io);
  app.get('/auth/google', authRoutes.authenticateGoogle);
  app.get('/auth/google/oauth2callback', authRoutes.authenticateGoogleCallback);
  app.get('/login', authRoutes.login);
  app.get('/', ensureLoggedIn('/login'), routes.index);
  app.get('/playGame', ensureLoggedIn('/login'), gameRoutes.playGame);
  app.get('/createGame', ensureLoggedIn('/login'), gameRoutes.createGame);
}

exports.route = route;