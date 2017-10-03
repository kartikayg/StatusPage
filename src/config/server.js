/**
 * @fileoverview Server configuration setup
 */

import Joi from 'joi';

/**
 * Returns a joi schema for the server config
 * @returns {object} Joi schema object
 */
export const schema = () => {
  return Joi.object({
    PORT: Joi.number()
      .required()
  });
};

/**
 * Extracts the server configuration
 * @param {object} env - object from joi validation on environment variables
 * @returns {object} 
 */
export const extract = (env = {}) => {
  return {
    server: {
      port: env.PORT
    }
  };
};
