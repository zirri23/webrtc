var merge = require('merge');

var commonFields = {
  id        : {type: "increments", nullable: false, primary: true},
  uuid      : {type: "uuid", nullable: false, unique: true},
  metadata  : {type: "json", nullable: true},
  created_at: {type: 'dateTime', nullable: false},
  updated_at: {type: 'dateTime', nullable: true}
}

var Schema = {
  players: merge({
	  name      : {type: "string", nullable: false},
	  remote_id : {type: "string", nullable: false},
    avatar    : {type: "string", nullable: true},
	  online    : {type: "boolean", defaultTo: false, nullable: false },
  }, commonFields),

	games: merge({
		creator   : {type: "integer"},
	}, commonFields),
	
	gamePlayers: merge({
    game_id    : {type: "integer", nullable: false},
    game_uuid  : {type: "uuid", nullable: false},
    player_id  : {type: "integer", nullable: false},
    player_uuid: {type: "uuid", nullable: false},
	}, commonFields),

  plays: merge({
    game_player_id  : {type: "integer", nullable: false},
    game_player_uuid: {type: "uuid", nullable: false},
    game_id         : {type: "integer", nullable: false},
    game_uuid       : {type: "uuid", nullable: false},
    player_id       : {type: "integer", nullable: false},
    player_uuid     : {type: "uuid", nullable: false},
  }, commonFields)
};

module.exports = Schema;