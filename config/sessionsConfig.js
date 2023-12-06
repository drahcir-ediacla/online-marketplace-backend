const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const pool = require('./dbConfig');


// Configure express-session
const sessionStore = new MySQLStore({
    clearExpired: true,
    checkExpirationInterval: 3600000,
    expiration: 3600000, // Maximum age of a valid session (1 hour)
    createDatabaseTable: true,
    schema: {
      tableName: 'sessions', // Name of your "sessions" table
      columnNames: {
        session_id: 'session_id',
        expires: 'expires',
        data: 'data',
      },
    },
  }, pool);
  

  
  module.exports = sessionStore;