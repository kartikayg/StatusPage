import {assert} from 'chai';
import Joi from 'joi';

import * as db from './db';

const validate = (data = {}) => db.schema(Joi).validate(data);
const testMongoUrl = 'mongodb://dave:password@localhost:27017/myproject';

describe('config/db', function() {

  describe('schema', function() {

    it('should return a joi object', function() {
      const schema = db.schema(Joi);
      assert.isObject(schema);
    });

    it('should validate the conf object', function() {

      const expectedResult = {MONGO_ENDPOINT: testMongoUrl};

      const {error, value} = validate({ MONGO_ENDPOINT: testMongoUrl });

      assert.deepEqual(value, expectedResult);
      assert.isNull(error);
    
    });

    it('should throw exception on missing/invalid MONGO_ENDPOINT', function() {
      
      const validate1 = validate();
      assert.match(validate1.error.message, /\"MONGO_ENDPOINT\" is required/);

      const validate2 = validate({MONGO_ENDPOINT: 1234});
      assert.match(validate2.error.message, /\"MONGO_ENDPOINT\" must be a string/);

      const validate3 = validate({MONGO_ENDPOINT: "mongodb"});
      assert.match(validate3.error.message, /\"MONGO_ENDPOINT" must be a valid uri with a scheme matching the mongodb/);

    });

  });

  describe('extract', function() {

    it('should return the conf object', function() {
      
      const expectedResult = {db: {mongo_url: testMongoUrl}};

      const {error, value} = validate({ MONGO_ENDPOINT: testMongoUrl });
      const config = db.extract(value);

      assert.deepEqual(config, expectedResult);

    });

  });

});