var Schema = {
  players: {
  	  id        : {type: "increments", nullable: false, primary: true},
	  uuid      : {type: "uuid", nullable: false, unique: true},
	  name      : {type: "string", nullable: false},
	  remote_id : {type: "string", nullable: false},
	  online    : {type: "boolean", defaultTo: false, nullable: false },
      created_at: {type: 'dateTime', nullable: false},
      updated_at: {type: 'dateTime', nullable: true}
  },

	games: {
		id : {type: "increments", nullable: false, primary: true},
		creator  : {type: "integer"},
	    uuid : {type: "uuid", nullable: false, unique: true},
        created_at: {type: 'dateTime', nullable: false},
        updated_at: {type: 'dateTime', nullable: true}
	},
	
	gamePlayers: {
		id       : {type: "increments", nullable: false, primary: true},
		game_id  : {type: "integer", nullable: false},
		player_id: {type: "integer", nullable: false},
	    uuid     : {type: "uuid", nullable: false, unique: true},
        created_at: {type: 'dateTime', nullable: false},
        updated_at: {type: 'dateTime', nullable: true}
	}
}

module.exports = Schema;