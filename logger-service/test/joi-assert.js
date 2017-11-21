/**
 * @fileover Helper functions to test JOI setup
 */

import {assert} from 'chai';
import Joi from 'joi';

const equal = (schema, data, expected, options = {}, message = '') => {

  const {error, value} = Joi.validate(data, schema, options);

  assert.deepEqual(value, expected, message);
  assert.isNull(error, message);

}

const error = (schema, data, errors, options = {}) => {

  const errorsToCheck = Array.isArray(errors) ? errors : [errors];
  const joiOptions    = Object.assign({ abortEarly: false }, options);

  const {error}       = Joi.validate(data, schema, joiOptions);

  error.details       = error.details || [];

  const errorsReturned = error.details.map(e => e.message);

  assert.deepEqual(errorsToCheck, errorsReturned);

}

export default Object.create({ equal, error });
