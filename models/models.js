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
  gamePlayers: function() {
  	return this.belongsToMany(GamePlayer);
  },
});

var Game = bookshelf.Model.extend({
	tableName: 'games',
	gamePlayers: function() {
		return this.belongsToMany(GamePlayer);
	},
	creator: function() {
		return this.belongsTo(Player);
	}
});

var GamePlayer = bookshelf.Model.extend({
	tableName: 'gamePlayers',
	game: function() {
		return this.belongsTo(Player);
	},
	player: function() {
		return this.belongsTo(Game);
	}
});

module.exports = {Player: Player, Game: Game, GamePlayer: GamePlayer};

