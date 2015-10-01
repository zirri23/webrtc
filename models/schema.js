var Schema = {
  players: {
  	id       : {type: "increments", nullable: false, primary: true},
	  uuid     : {type: "uuid", nullable: false, unique: true},
	  name     : {type: "string", nullable: false},
	  remoteId : {type: "string", nullable: false},
	  online   : {type: "boolean", defaultTo: false, nullable: false }
  }
}

module.exports = Schema;