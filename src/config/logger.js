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
    CONSOLE_LOG_LEVEL: Joi.string()
      .only(['error', 'warn', 'info', 'debug'])
      .optional(),
    DB_LOG_LEVEL: Joi.string()
      .only(['error', 'warn', 'info', 'debug'])
      .optional()
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
      console: env.CONSOLE_LOG_LEVEL,
      db: env.DB_LOG_LEVEL
    }
  };
};
