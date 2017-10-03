/**
 * @fileoverview DB configuration setup
 */

import Joi from 'joi';

/**
 * Returns a joi schema for the logger config
 * @returns {object} Joi schema obbject
 */
export const schema = () => {
  return Joi.object({
    MONGO_ENDPOINT: Joi.string()
      .uri({ scheme: ['mongodb'] })
      .required()
  });
};

/**
 * Extracts the configuration
 * @param {object} env - object from joi validation on environment variables
 * @returns {object} 
 */
export const extract = (env = {}) => {
  return {
    db: {
      mongo_url: env.MONGO_ENDPOINT
    }
  };
};
