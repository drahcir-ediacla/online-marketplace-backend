const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const db = require('./dbConfig');


// Configure express-session
const sessionStore = new MySQLStore({
    expiration: 3600000, // Session expiration time in milliseconds (1 hour)
    schema: {
      tableName: 'sessions', // Name of your "sessions" table
      columnNames: {
        session_id: 'session_id',
        expires: 'expires',
        data: 'data',
      },
    },
  }, db);
  

  
  module.exports = sessionStore;