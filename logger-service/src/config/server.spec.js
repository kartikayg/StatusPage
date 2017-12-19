/**
 * TESTING JOI OBJECT - the idea is to test that the rules set in JOI schema
 * are correct or not.
 */

import {assert} from 'chai';
import joiassert from '../../test/joi-assert';

import {schema} from './server';

describe('config/server', function() {

  const data = {
    PORT: 1234,
    NODE_ENV: 'development', 
    RABBMITMQ_CONN_ENDPOINT: 'amqp://localhost' 
  };

  it ('should return a joi object', function() {
    assert.isObject(schema);
  });

  it ('should validate the conf object', function() {
    joiassert.equal(schema, data, data);
  });

  it ('should throw exception on missing required set', function() {
    
    joiassert.error(
      schema, 
      {},
      ['"NODE_ENV" is required', '"PORT" is required', '"RABBMITMQ_CONN_ENDPOINT" is required']
    );

    joiassert.error(
      schema, 
      Object.assign({}, data, {PORT: 'test'}),
      '"PORT" must be a number'
    );

  });

});