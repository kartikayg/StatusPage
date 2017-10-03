/**
 * @fileoverview Logger configuration setup
 */

import Joi from 'joi';

/**
 * Returns a joi schema for the logger config
 * @returns {object} Joi schema object
 */
export const schema = () => {
  return Joi.object({
    LOG_LEVEL: Joi.string()
      .only(['error', 'warn', 'info', 'debug'])
      .default('info'),
    LOGGING_ENABLED: Joi.boolean()
      .default(true)
  });
};

/**
 * Extracts the logger configuration
 * @param {object} env - object from joi validation on environment variables
 * @returns {object} 
 */
export const extract = (env = {}) => {
  return {
    logger: {
      level: env.LOG_LEVEL,
      isEnabled: env.LOGGING_ENABLED
    }
  };
};
