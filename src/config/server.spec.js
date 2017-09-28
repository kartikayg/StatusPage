import {assert} from 'chai';
import Joi from 'joi';

import * as server from './server';

const validate = (data = {}) => server.schema(Joi).validate(data);

describe('config/server', function() {

  describe('config/server/schema', function() {

    it('should return a joi object', function() {
      const schema = server.schema(Joi);
      assert.isObject(schema);
    });

    it('should validate the conf object', function() {

      const expectedResult = {PORT: 1234};

      const {error, value} = validate({ PORT: 1234 });

      assert.deepEqual(value, expectedResult);
      assert.isNull(error);
    
    });

    it('should throw exception on missing/invalid PORT number', function() {
      
      const validate1 = validate();
      assert.match(validate1.error.message, /\"PORT\" is required/);

      const validate2 = validate({PORT: "test"});
      assert.match(validate2.error.message, /\"PORT\" must be a number/);

    });

  });

  describe('config/server/extract', function() {

    it('should return the conf object', function() {
      
      const expectedResult = {server: {port: 1234}};

      const {error, value} = validate({ PORT: 1234 });
      const config = server.extract(value);

      assert.deepEqual(config, expectedResult);

    });

  });

});