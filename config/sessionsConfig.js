const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const db = require('./dbConfig');

// Configure express-session
const sessionStore = new MySQLStore(
  {
    clearExpired: true, // Automatically clear expired sessions
    checkExpirationInterval: 86400000, // Check every 1 minute
    expiration: 86400000, // Session expiration (1 day)
    createDatabaseTable: true, // Automatically create table if not exists
    schema: {
      tableName: 'sessions', // Name of your "sessions" table
      columnNames: {
        session_id: 'session_id', // Session ID column
        expires: 'expires', // Expiration column
        data: 'data', // Session data column
      },
    },
  },
  db
);

// Periodic Cleanup as Fallback
setInterval(() => {
  const query = `
      DELETE FROM sessions 
      WHERE expires = '0000-00-00 00:00:00' OR expires < NOW()
  `;
  db.query(query, (err, result) => {
    if (err) {
      console.error('Error clearing invalid sessions:', err);
    } else {
      console.log('Invalid sessions cleared:', result.affectedRows);
    }
  });
}, 86400000); // Run cleanup every 1 day

module.exports = sessionStore;
