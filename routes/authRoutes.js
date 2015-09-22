var passport = require('passport');

exports.authenticateGoogle = passport.authenticate('google', {
  scope : [ 'https://www.googleapis.com/auth/userinfo.profile']
});

exports.authenticateGoogleCallback = passport.authenticate('google', {
  failureRedirect : '/login',
  successReturnToOrRedirect: '/'
});

exports.login = function(req, res) {
  res.render('home/login.html');
};