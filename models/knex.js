var envs = {
		"dev" : {
            client: 'sqlite3',
            debug: false,
		  connection: {
		  	"filename": "./app.sqlite",
		  }
		},
    "prod" : {
        client: 'mysql',
        debug: false,
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
console.log("Starting knex env: " + envs[env]);
module.exports = require('knex')(envs[env]);