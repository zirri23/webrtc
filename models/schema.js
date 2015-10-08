var Schema = {
  players: {
  	  id        : {type: "increments", nullable: false, primary: true},
	  uuid      : {type: "uuid", nullable: false, unique: true},
	  name      : {type: "string", nullable: false},
	  remote_id : {type: "string", nullable: false},
	  online    : {type: "boolean", defaultTo: false, nullable: false }
  },

	games: {
		id : {type: "increments", nullable: false, primary: true},
		creator  : {type: "integer"},
	    uuid : {type: "uuid", nullable: false, unique: true},
	},
	
	gamePlayers: {
		id       : {type: "increments", nullable: false, primary: true},
		game_id  : {type: "integer", nullable: false},
		player_id: {type: "integer", nullable: false},
	    uuid     : {type: "uuid", nullable: false, unique: true},
	}
}

module.exports = Schema;