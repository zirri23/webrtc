var envs = {
		"dev" : {
			client: "sqlite3",
		  connection: {
		  	"filename": "app.sqlite",
		  }
		},
    "prod" : {
    	client: "mysql",
      connection: {
        host     : "127.0.0.1",
        user     : "webrtc",
        password : "password",
        database : "webrtc",
        charset  : "utf8"
      }
    }
};
var env = process.env.NODE_ENV || "dev";
var knex = require("./knex");
var merge = require("merge");

var bookshelf = require("bookshelf")(knex);

var BaseMetadataModel = bookshelf.Model.extend({
  hasTimestamps: ["created_at", "updated_at"],
  getAllMetadata: function() {
    var metadata = this.get("metadata");
    if (metadata == null || metadata == undefined) {
      return {};
    }
    return JSON.parse(metadata);
  },
  getMetadata: function(key) {
    return this.getAllMetadata()[key];
  },
  setMetadata: function(key, value) {
    var metadata = this.getAllMetadata();
    metadata[key] = value;
    this.set("metadata", JSON.stringify(metadata));
  },
  setAllMetadata: function(map) {
    var metadata = this.getAllMetadata();
    var toSave = merge(metadata, map);
    this.set("metadata", JSON.stringify(toSave));
  },
  toJSON: function () {
    var attrs = bookshelf.Model.prototype.toJSON.apply(this, arguments);
    attrs.metadata = null;
    return merge(attrs, this.getAllMetadata());
  }
});

var Player = BaseMetadataModel.extend({
  tableName: "players",
  gamePlayers: function() {
    return this.hasMany(GamePlayer);
  },
  plays: function() {
    return this.hasMany(Play);
  }
});

var Game = BaseMetadataModel.extend({
	tableName: "games",
	gamePlayers: function() {
		return this.hasMany(GamePlayer);
	},
  plays: function() {
    return this.hasMany(Play);
  },
	creator: function() {
		return this.belongsTo(Player, "creator");
	}
});

var GamePlayer = BaseMetadataModel.extend({
	tableName: "gamePlayers",
	player: function() {
		return this.belongsTo(Player);
	},
	game: function() {
		return this.belongsTo(Game);
	},
  plays: function() {
    return this.hasMany(Play);
  }
});

var Play = BaseMetadataModel.extend({
  tableName: "plays",
  game: function() {
    return this.belongsTo(Game);
  },
  player: function() {
    return this.belongsTo(Player);
  },
  gamePlayer: function() {
    return this.belongsTo(GamePlayer);
  }
});

module.exports = {Player: Player, Game: Game, GamePlayer: GamePlayer, Play: Play, transaction: bookshelf.transaction};

