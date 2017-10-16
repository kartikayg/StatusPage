import {assert} from 'chai';
import Joi from 'joi';
import _ from 'lodash/fp';

const equal = (schema, data, expected, options = {}, message = '') => {

  const {error, value} = Joi.validate(data, schema, options);

  assert.deepEqual(value, expected, message);
  assert.isNull(error, message);

}

const error = (schema, data, errors, options = {}) => {

  const errorsToCheck = _.isArray(errors) ? errors : [errors];
  const joiOptions    = Object.assign({ abortEarly: false }, options);

  const {error}       = Joi.validate(data, schema, joiOptions);

  error.details       = error.details || [];

  const errorsReturned = _.map(e => e.message)(error.details);

  // console.log(errorsToCheck);
  // console.log(errorsReturned);

  assert.deepEqual(errorsToCheck, errorsReturned);

}

export default Object.create({ equal, error });