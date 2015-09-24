/*
 * GET home page.
 */
var gameRoutes = require('./gameRoutes');

exports.setIo = function(i) {
  io = i;
  gameRoutes.setIo(i);
};

exports.setModels = function(m) {
  models = m;
  gameRoutes.setModels(m);
};

exports.index = function(req, res) {
  res.render('home/index.html', {
    csrfToken : req.session._csrf
  });
};