import {assert} from 'chai';
import joiassert from '../../test/joi-assert';

import {schema} from './server';

describe('config/server', function() {

  describe('schema', function() {

    const data = {
      PORT: 1234,
      NODE_ENV: 'development',
      RABBMITMQ_CONN_ENDPOINT: 'amqp://localhost',
      ENABLE_HTTP_REQUEST_LOGS: true
    }
    
    it ('should return a joi object', function() {
      assert.isObject(schema);
    });

    it ('should validate the conf object', function() {
      joiassert.equal(schema, data, data);
    });

    it ('should throw error on invalid port number', function () {

      joiassert.error(
        schema, 
        Object.assign({}, data, {PORT: 'test'}),
        '"PORT" must be a number'
      );

    });

    it ('should throw an error on invalid rabbitmq conn', function () {
      
      joiassert.error(
        schema, 
        Object.assign({}, data, { RABBMITMQ_CONN_ENDPOINT: 'test' }),
        '"RABBMITMQ_CONN_ENDPOINT" must be a valid uri with a scheme matching the amqp pattern'
      );

    })

    it ('should throw exception on missing required values', function() {
    
      joiassert.error(
        schema, 
        {},
        ['"NODE_ENV" is required', '"PORT" is required', '"RABBMITMQ_CONN_ENDPOINT" is required']
      );

    });

    it ('should throw exception on invalid node env', function () {

      joiassert.error(
        schema,
        Object.assign({}, data, {NODE_ENV: 'string'}),
        '"NODE_ENV" must be one of [development, production, test]'
      );

    });

  });

});