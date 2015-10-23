/*
 * GET home page.
 */
var gameRoutes = require('./gameRoutes');

exports.index = function(req, res) {
  res.render('home/index.html', {
    csrfToken : req.session._csrf
  });
};