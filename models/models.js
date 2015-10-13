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
  tableName: 'players',
  hasTimestamps: ['created_at', 'updated_at'],
  gamePlayers: function() {
  	return this.hasMany(GamePlayer);
  },
});

var Game = bookshelf.Model.extend({
	tableName: 'games',
    hasTimestamps: ['created_at', 'updated_at'],
	gamePlayers: function() {
		return this.hasMany(GamePlayer);
	},
	creator: function() {
		return this.belongsTo(Player);
	}
});

var GamePlayer = bookshelf.Model.extend({
	tableName: 'gamePlayers',
    hasTimestamps: ['created_at', 'updated_at'],
	game: function() {
		return this.belongsTo(Player);
	},
	player: function() {
		return this.belongsTo(Game);
	}
});

module.exports = {Player: Player, Game: Game, GamePlayer: GamePlayer};

