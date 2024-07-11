const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const db = require('./dbConfig');


// Configure express-session
const sessionStore = new MySQLStore({
    clearExpired: true,
    checkExpirationInterval: 86400000,
    expiration: 86400000, // Maximum age of a valid session (1 day)
    createDatabaseTable: true,
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