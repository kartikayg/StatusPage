/**
 * @fileoverview Email configuration setup
 */

import Joi from 'joi';

/**
 * Returns a joi schema for the email config
 * @returns {object} Joi schema object
 */
export const schema = Joi.object({

  SMTP_HOST_NAME: Joi.string()
    .required(),
  SMTP_PORT: Joi.number()
    .required(),
  SMTP_USERNAME: Joi.string()
    .required(),
  SMTP_PASSWORD: Joi.string()
    .required(),
  SYSTEM_EMAIL_FROM_ADDRESS: Joi.string()
    .email()
    .required(),
  EMAIL_HEADER_COMPANY_NAME: Joi.string()
    .required()

});

