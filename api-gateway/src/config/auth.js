/**
 * @fileoverview Auth configuration setup
 */

import Joi from 'joi';

/**
 * Returns a joi schema for the auth config
 * @returns {object} Joi schema object
 */
export const schema =
  Joi.object().keys({

    JWT_SECRET_KEY: Joi.string()
      .required(),

    ADMIN_USERNAME: Joi.string()
      .required(),
    ADMIN_PASSWORD: Joi.string()
      .required()

  });
