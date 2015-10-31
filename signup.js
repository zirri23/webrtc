var passport = require('passport');
var uuid = require('node-uuid');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var GOOGLE_CLIENT_ID = {
  dev : "616440645031-1j6d82i97a1jflp9p5a93n5cdf6kcefj.apps.googleusercontent.com",
  prod : "616440645031.apps.googleusercontent.com"
};
var GOOGLE_CLIENT_SECRET = {
  dev : "BF7izM-P4E9cohhTMKyLxlRm",
  prod : '1En8Yn5gLrWDV-zbfQFtzfEk'
};
var GOOGLE_CALLBACK_URL = {
  dev: "http://localhost/auth/google/oauth2callback",
  prod: "http://www.spargame.com/auth/google/oauth2callback"
};

exports.initSignups = function(env, Bookshelf) {
  passport.serializeUser(function(player, done) {
    done(null, player.id);
  });

  passport.deserializeUser(function(id, done) {
  	Bookshelf.Player.where('id', id).fetch().then(function (player) {
      done(null, player);
    }).catch(function(err) {
    	console.error(err);
    });
  });
  
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID[env],
    clientSecret: GOOGLE_CLIENT_SECRET[env],
    callbackURL: GOOGLE_CALLBACK_URL[env],
  },
  function(accessToken, refreshToken, profile, done) {
    Bookshelf.Player.where({ remote_id: profile.id }).fetch().then(function(player) {
    	if (player) {
    		done(null, player);
    	} else {
    		Bookshelf.Player.forge({remote_id: profile.id, uuid: uuid.v4(),
          name: profile.displayName, avatar: profile._json.image.url.replace("sz=50", "")}).save().then(function(player) {
              console.log("created user: " + player.id);
              done(null, player);
            });
    	}
    }).catch(function(err) {
    	console.log(err);
    });
  }));
};
