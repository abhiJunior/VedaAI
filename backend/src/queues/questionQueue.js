import { Queue } from 'bullmq';
import getRedisClient from '../config/redis.js';

export const questionQueue = new Queue('question-generation', {
  connection: getRedisClient(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

console.log('📋 Question generation queue initialized');
