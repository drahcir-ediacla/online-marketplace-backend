const Redis = require('ioredis');

const getRedisUrl = () => {
    if(process.env.REDIS_URL) {
        return process.env.REDIS_URL
    }
    throw new Error('Redis Url is not defined')
}

const redisClient = new Redis(getRedisUrl());

module.exports = redisClient;