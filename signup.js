var passport = require('passport');
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

exports.initSignups = function(env, models) {
  passport.serializeUser(function(player, done) {
    done(null, player.id);
  });

  passport.deserializeUser(function(id, done) {
    models.Player.findById(id).then(function (player, found) {
      done(null, player);
    });
  });
  
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID[env],
    clientSecret: GOOGLE_CLIENT_SECRET[env],
    callbackURL: GOOGLE_CALLBACK_URL[env],
  },
  function(accessToken, refreshToken, profile, done) {
    models.Player.findOrCreate({where: { remoteId: profile.id }}).spread(
        function(player, created) {
          setRemoteAvatar(player, profile, done);
        });
  }));
};

function setRemoteAvatar(player, profile, done) {
  player.createMetadatum({
    key: 'remoteAvatar',
    value: profile._json.image.url
  }).then(function(){
    return done(null, player);
  });
}