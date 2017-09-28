import {assert} from 'chai';
import Joi from 'joi';

import * as logger from './logger';

const validate = data => logger.schema(Joi).validate(data);

describe('config/logger', function() {

  describe('config/logger/schema', function() {

    it('should return a joi object', function() {
      const schema = logger.schema(Joi);
      assert.isObject(schema);
    });

    it('should validate the conf object', function() {

      const expectedResult = {LOG_LEVEL: 'warn', LOGGING_ENABLED: false};

      const {error, value} = validate({ LOG_LEVEL: 'warn', LOGGING_ENABLED: false });

      assert.deepEqual(value, expectedResult);
      assert.isNull(error);
    
    });

    it('should honor the default values', function() {

      const expectedResult = {LOG_LEVEL: 'info', LOGGING_ENABLED: true};

      const {error, value} = validate({});

      assert.deepEqual(value, expectedResult);
      assert.isNull(error);
    
    });

    it('should throw exception on invalid LOG_LEVEL', function() {
      
      const validate1 = validate({LOG_LEVEL: 'test'});
      assert.match(validate1.error.message, /\"LOG_LEVEL\" fails/);

      const validate2 = validate({LOG_LEVEL: true});
      assert.match(validate2.error.message, /\"LOG_LEVEL\" fails/);

    });

    it('should throw exception on invalid LOGGING_ENABLED', function() {
      const {error} = validate({LOGGING_ENABLED: 'test'});
      assert.match(error.message, /\"LOGGING_ENABLED\" fails/);
    });

  });

  describe('config/logger/extract', function() {

    it('should return the conf object', function() {
      
      const expectedResult = {logger: {level: 'warn', isEnabled: false}};

      const {error, value} = validate({ LOG_LEVEL: 'warn', LOGGING_ENABLED: false });
      const config = logger.extract(value);

      assert.deepEqual(config, expectedResult);

    });

  });

});
