import {assert} from 'chai';
import Joi from 'joi';

const equal = (schema, data, expected, options = {}, message = '') => {

  const {error, value} = Joi.validate(data, schema, options);

  assert.deepEqual(value, expected, message);
  assert.isNull(error, message);
  
}

const error = (schema, data, regexp, options = {}, message = '') => {

  const {error, value} = Joi.validate(data, schema, options);
  assert.match(error.message, regexp, message);

}

export default Object.create({ equal, error });