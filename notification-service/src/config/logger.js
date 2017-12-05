/**
 * @fileoverview Logger configuration setup
 */

import Joi from 'joi';

import {allowedLevels} from '../lib/logger';

/**
 * Returns a joi schema for the logger config
 * @returns {object} Joi schema object
 */
export const schema =
  Joi.object().keys({

    LOG_LEVEL: Joi.string()
      .only(allowedLevels)
      .optional()

  });
