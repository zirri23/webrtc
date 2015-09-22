/*
 * GET home page.
 */
var gameRoutes = require('./gameRoutes');
var expand = require('./dbUtils').expand;

exports.setIo = function(i) {
  io = i;
  gameRoutes.setIo(i);
};

exports.setModels = function(m) {
  models = m;
  gameRoutes.setModels(m);
};

exports.index = function(req, res) {
  expand(req.user, function(user) {
    console.log(user);
    res.render('home/index.html', {
      player : user,
      csrfToken : req.session._csrf
    });
  });
};