/**
 * @fileoverview RedisDb adapter to use in this microservice.
 */

import Redis from 'ioredis';

import logger from './logger';

/**
 * Retry stratergy for redis connection
 */
const retryStrategy = (times) => {
  return Math.max(times * 200, 2000);
};

/**
 * Creates a Redis Db connection
 * @param {string} endpoint - redis db endpoint
 * @return redis
 *  if success, a mongodb conn object
 *  if rejected, error
 */
const connect = (endpoint) => {

  const redis = new Redis(endpoint, {
    retryStrategy
  });

  // on error event
  redis.on('error', e => {
    logger.error(e);
  });

  return redis;

};

export default {
  connect
};
