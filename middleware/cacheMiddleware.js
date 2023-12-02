const redisClient = require('../config/redisClient')

// Middleware to cache responses for a specific route using Upstash
const cacheMiddleware = (req, res, next) => {
    const key = req.originalUrl || req.url;
  
    // Check if data is present in Upstash cache
    redisClient.get(key, (err, cachedData) => {
      if (err) {
        console.error(err);
        next(); // Continue to the route handler in case of an error
      }
  
      if (cachedData) {
        // If data is found in the cache, send it
        res.send(JSON.parse(cachedData));
      } else {
        // If data is not in the cache, proceed with the route handler
        next();
      }
    });
  };


  module.exports = cacheMiddleware