var Schema = {
  players: {
    id        : {type: "increments", nullable: false, primary: true},
	  uuid      : {type: "uuid", nullable: false, unique: true},
	  name      : {type: "string", nullable: false},
	  remote_id : {type: "string", nullable: false},
    avatar    : {type: "string", nullable: true},
	  online    : {type: "boolean", defaultTo: false, nullable: false },
    metadata  : {type: "json", nullable: true},
    created_at: {type: 'dateTime', nullable: false},
    updated_at: {type: 'dateTime', nullable: true}
  },

	games: {
		id        : {type: "increments", nullable: false, primary: true},
		creator   : {type: "integer"},
    uuid      : {type: "uuid", nullable: false, unique: true},
    metadata  : {type: "json", nullable: true},
    created_at: {type: 'dateTime', nullable: false},
    updated_at: {type: 'dateTime', nullable: true}
	},
	
	gamePlayers: {
		id         : {type: "increments", nullable: false, primary: true},
    game_id    : {type: "integer", nullable: false},
    game_uuid  : {type: "uuid", nullable: false},
    player_id  : {type: "integer", nullable: false},
    player_uuid: {type: "uuid", nullable: false},
    uuid       : {type: "uuid", nullable: false},
    metadata   : {type: "json", nullable: true},
    created_at : {type: 'dateTime', nullable: false},
    updated_at : {type: 'dateTime', nullable: true}
	},

  plays: {
    id              : {type: "increments", nullable: false, primary: true},
    uuid            : {type: "uuid", nullable: false, unique: true},
    game_player_id  : {type: "integer", nullable: false},
    game_player_uuid: {type: "uuid", nullable: false},
    game_id         : {type: "integer", nullable: false},
    game_uuid       : {type: "uuid", nullable: false},
    player_id       : {type: "integer", nullable: false},
    player_uuid     : {type: "uuid", nullable: false},
    metadata        : {type: "json", nullable: true},
    created_at      : {type: 'dateTime', nullable: false},
    updated_at      : {type: 'dateTime', nullable: true}
  }
}

module.exports = Schema;