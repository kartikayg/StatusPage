/**
 * @fileoverview Server configuration setup
 */

import Joi from 'joi';

/**
 * Returns a joi schema for the server config
 * @returns {object} Joi schema object
 */
export const schema =
  Joi.object().keys({
    NODE_ENV: Joi.string()
      .required()
      .only(['development', 'production', 'test']),
    PORT: Joi.number()
      .required(),
    LOG_HTTP_REQUEST_WRITER: Joi.string()
      .optional()
      .only(['file', 'db', 'console']),
    LOG_HTTP_REQUEST_DIRNAME: Joi.string(),
    LOG_HTTP_REQUEST_PREFIX: Joi.string()
      .default('request')
  }).with('LOG_HTTP_REQUEST_WRITER', 'LOG_HTTP_REQUEST_DIRNAME');
