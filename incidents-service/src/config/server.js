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
      .only('development', 'production', 'test'),

    PORT: Joi.number()
      .required(),

    RABBMITMQ_CONN_ENDPOINT: Joi.string()
      .required()
      .uri({ scheme: 'amqp' }),

    ENABLE_HTTP_REQUEST_LOGS: Joi.boolean()
      .default(false),

    COMPONENTS_SERVICE_URI: Joi.string()
      .required()
      .uri({ scheme: ['http', 'https'] })
  });
