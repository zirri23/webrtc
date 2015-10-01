var envs = {
		"dev" : {
			client: 'sqlite3',
		  connection: {
		  	"filename": "app.sqlite",
		  }
		},
    "prod" : {
    	client: 'mysql',
      connection: {
        host     : '127.0.0.1',
        user     : 'webrtc',
        password : 'password',
        database : 'webrtc',
        charset  : 'utf8'
      }
    }
}
var env = process.env.NODE_ENV || 'dev';
var knex = require('./knex');

var bookshelf = require('bookshelf')(knex);

var Player = bookshelf.Model.extend({
  tableName: 'players'
});

module.exports = {Player: Player}

