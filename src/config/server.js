/**
 * @fileoverview Server configuration setup
 */

import Joi from 'joi';

/**
 * Returns a joi schema for the server config
 * @returns {object} Joi schema object
 */
export const schema =
  Joi.object({
    NODE_ENV: Joi.string()
      .required()
      .only(['development', 'production', 'test']),
    PORT: Joi.number()
      .required(),
    LOG_HTTP_REQUEST_WRITER: Joi.string()
      .optional()
      .only(['file', 'db', 'console'])
  });
