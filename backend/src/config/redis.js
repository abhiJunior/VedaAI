import Redis from 'ioredis';

let redisClient;

const getRedisClient = () => {
  if (!redisClient) {
    const redisOptions = {
      maxRetriesPerRequest: null,
      // Upstash sometimes needs this to keep the connection alive
      enableReadyCheck: false, 
    };

    if (process.env.REDIS_URL) {
      // The REDIS_URL from .env (now with rediss://)
      redisClient = new Redis(process.env.REDIS_URL, redisOptions);
    } else {
      redisClient = new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        ...redisOptions,
      });
    }

    redisClient.on('connect', () => console.log('🚀 Redis connecting...'));
    redisClient.on('ready', () => console.log('✅ Redis connected and ready'));
    redisClient.on('error', (err) => console.error('❌ Redis error:', err.message));
  }
  return redisClient;
};

export default getRedisClient;