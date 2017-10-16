/**
 * @fileoverview Logger configuration setup
 */

import Joi from 'joi';

import {logLevels} from '../lib/logger';

/**
 * Returns a joi schema for the logger config
 * @returns {object} Joi schema object
 */
export const schema =
  Joi.object().keys({
    LOG_CONSOLE_LEVEL: Joi.string()
      .only(logLevels)
      .optional(),
    LOG_DB_LEVEL: Joi.string()
      .only(logLevels)
      .optional(),
    LOG_FILE_LEVEL: Joi.string()
      .only(logLevels)
      .optional(),
    LOG_FILE_DIRNAME: Joi.string(),
    LOG_FILE_PREFIX: Joi.string()
      .default('log')
  }).with('LOG_FILE_LEVEL', 'LOG_FILE_DIRNAME');
