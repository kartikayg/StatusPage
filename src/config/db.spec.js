import {assert} from 'chai';
import joiassert from '../../test/joi-assert';

import * as db from './db';

const testMongoUrl = 'mongodb://dave:password@localhost:27017/myproject';

describe('config/db', function() {

  describe('schema', function() {

    let dbSchema;

    before(function() {
      dbSchema = db.schema();
    });

    it('should return a joi object', function() {
      assert.isObject(dbSchema);
    });

    it('should validate the conf object', function() {

      joiassert.equal(
        dbSchema,
        { MONGO_ENDPOINT: testMongoUrl },
        { MONGO_ENDPOINT: testMongoUrl }
      );

    });

    it('should throw exception on missing/invalid MONGO_ENDPOINT', function() {
      
      joiassert.error(
        dbSchema,
        {},
        '"MONGO_ENDPOINT" is required'
      );

      joiassert.error(
        dbSchema, 
        { MONGO_ENDPOINT: 1234 },
        '"MONGO_ENDPOINT" must be a string'
      );

      joiassert.error(
        dbSchema, 
        { MONGO_ENDPOINT: "mongodb" },
        '"MONGO_ENDPOINT" must be a valid uri with a scheme matching the mongodb pattern'
      );

    });

  });

  describe('extract', function() {

    it('should return the conf object', function() {
      
      const expectedResult = {db: {mongo_url: testMongoUrl}};
      const config = db.extract({ MONGO_ENDPOINT: testMongoUrl });

      assert.deepEqual(config, expectedResult);

    });

  });

});