/**
 * TESTING JOI OBJECT - the idea is to test that the rules set in JOI schema
 * are correct or not.
 */

import {assert} from 'chai';
import joiassert from '../../test/joi-assert';

import {schema} from './db';

const testMongoUrl = 'mongodb://dave:password@localhost:27017/myproject';

describe('config/db', function() {

  describe('schema', function() {

    it('should return a joi object', function() {
      assert.isObject(schema);
    });

    it('should validate the conf object', function() {

      joiassert.equal(
        schema,
        { MONGO_ENDPOINT: testMongoUrl },
        { MONGO_ENDPOINT: testMongoUrl }
      );

    });

    it('should throw exception on missing/invalid MONGO_ENDPOINT', function() {
      
      joiassert.error(
        schema,
        {},
        '"MONGO_ENDPOINT" is required'
      );

      joiassert.error(
        schema, 
        { MONGO_ENDPOINT: 1234 },
        '"MONGO_ENDPOINT" must be a string'
      );

      joiassert.error(
        schema, 
        { MONGO_ENDPOINT: "mongodb" },
        '"MONGO_ENDPOINT" must be a valid uri with a scheme matching the mongodb pattern'
      );

    });

  });

});