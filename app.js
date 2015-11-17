
/**
 * Module dependencies.
 */

var express = require('express')
  , urls = require('./routes/urls')
  , http = require('http')
  , swig = require('swig')
  , passport = require('passport')
  , sockets = require('./sockets')
  , signup = require("./signup")
  , swig = require("swig")
  , cookieParser = require('cookie-parser')
  , path = require('path');

var env = process.env.NODE_ENV || 'dev';

var app = express();
var sessionSecret = "9asdg0o8y4p8w398er89wepoijh";
var PeerServer = require('peer').PeerServer;
PeerServer({port: 8001});

var sessionStore = new express.session.MemoryStore({
  reapInterval : 60000 * 10
});

// all environments
app.set('port', process.env.PORT || 80);
app.engine('html', swig.renderFile);
swig.setDefaults({ cache: env == 'prod' ? "memory" : false });
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(cookieParser());
var MemoryStore = express.session.MemoryStore;
app.use(express.session({
  key : 'express.sid',
  secret : "9asdg0o8y4p8w398er89wepoijh",
  store : sessionStore
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.csrf());
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('dev' == app.get('env')) {
  app.use(express.errorHandler());
}

var Bookshelf = require('./models/models');

var server = http.createServer(app);

var io = sockets.handle(
    server, cookieParser, sessionStore, sessionSecret);

server.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port') +
      " in " + env + " mode.");
});

signup.initSignups(env, Bookshelf);

urls.route(app, Bookshelf, io);

