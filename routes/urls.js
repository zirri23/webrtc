var routes = require('./routes');
var authRoutes = require('./authRoutes');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
var gameRoutes = require('./gameRoutes');

function route(app, models, io) {
  routes.setModels(models);
  routes.setIo(io);
  app.get('/auth/google', authRoutes.authenticateGoogle);
  app.get('/auth/google/oauth2callback', authRoutes.authenticateGoogleCallback);
  app.get('/login', authRoutes.login);
  app.get('/', ensureLoggedIn('/login'), routes.index);
  app.post('/createGame', ensureLoggedIn('/login'), gameRoutes.createGame);
  app.get('/playGame', ensureLoggedIn('/login'), gameRoutes.playGame);
}

exports.route = route;