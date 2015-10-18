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
  plays: function() {
    return this.hasMany(Play);
  },
  getAllMetadata: function() {
    return JSON.parse(this.get("metadata"));
  },
  getMetadata: function(key) {
      return JSON.parse(this.get("metadata"))[key];
  }
});

var Game = bookshelf.Model.extend({
	tableName: 'games',
    hasTimestamps: ['created_at', 'updated_at'],
	gamePlayers: function() {
		return this.hasMany(GamePlayer);
	},
  plays: function() {
    return this.hasMany(Play);
  },
	creator: function() {
		return this.belongsTo(Player, "creator");
	},
  getAllMetadata: function() {
    return JSON.parse(this.get("metadata"));
  },
  getMetadata: function(key) {
    return JSON.parse(this.get("metadata"))[key];
  }
});

var GamePlayer = bookshelf.Model.extend({
	tableName: 'gamePlayers',
  hasTimestamps: ['created_at', 'updated_at'],
	player: function() {
		return this.belongsTo(Player);
	},
	game: function() {
		return this.belongsTo(Game);
	},
  plays: function() {
    return this.hasMany(Play);
  },
  getAllMetadata: function() {
    return JSON.parse(this.get("metadata"));
  },
  getMetadata: function(key) {
    return JSON.parse(this.get("metadata"))[key];
  }
});

var Play = bookshelf.Model.extend({
  tableName: "plays",
  hasTimestamps: ['created_at', 'updated_at'],
  game: function() {
    return this.belongsTo(Game);
  },
  player: function() {
    return this.belongsTo(Player);
  },
  gamePlayer: function() {
    return this.belongsTo(GamePlayer);
  },
})

module.exports = {Player: Player, Game: Game, GamePlayer: GamePlayer};

