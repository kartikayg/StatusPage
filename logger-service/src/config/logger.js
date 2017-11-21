/**
 * @fileoverview Logger configuration setup
 */

import Joi from 'joi';

import {allowedLevels} from '../lib/logger/application';

/**
 * Returns a joi schema for the logger config
 * @returns {object} Joi schema object
 */
export const schema =
  Joi.object().keys({

    LOG_LEVEL: Joi.string()
      .valid(allowedLevels)
      .default('error'),

    LOG_REQUEST_WRITER: Joi.array()
      .items(Joi.string().label('LOG_REQUEST_WRITER').valid('console', 'file')),

    LOG_APPLICATION_WRITER: Joi.array()
      .items(Joi.string().label('LOG_APPLICATION_WRITER').valid('console', 'file')),

    LOG_FILE_DIRNAME: Joi.string()

  });
