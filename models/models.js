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

var Player = bookshelf.Model.extend({
  tableName: "players",
  hasTimestamps: ["created_at", "updated_at"],
  gamePlayers: function() {
    return this.hasMany(GamePlayer);
  },
  plays: function() {
    return this.hasMany(Play);
  },
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

var Game = bookshelf.Model.extend({
	tableName: "games",
    hasTimestamps: ["created_at", "updated_at"],
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

var GamePlayer = bookshelf.Model.extend({
	tableName: "gamePlayers",
  hasTimestamps: ["created_at", "updated_at"],
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

var Play = bookshelf.Model.extend({
  tableName: "plays",
  hasTimestamps: ["created_at", "updated_at"],
  game: function() {
    return this.belongsTo(Game);
  },
  player: function() {
    return this.belongsTo(Player);
  },
  gamePlayer: function() {
    return this.belongsTo(GamePlayer);
  },
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

module.exports = {Player: Player, Game: Game, GamePlayer: GamePlayer, Play: Play, transaction: bookshelf.transaction};

