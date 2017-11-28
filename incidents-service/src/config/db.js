/**
 * @fileoverview DB configuration setup
 */

import Joi from 'joi';

/**
 * Returns a joi schema for the logger config
 * @returns {object} Joi schema obbject
 */
export const schema =
  Joi.object({
    MONGO_ENDPOINT: Joi.string()
      .uri({ scheme: ['mongodb'] })
      .required()
  });
