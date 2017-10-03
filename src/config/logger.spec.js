import {assert} from 'chai';
import joiassert from '../../test/joi-assert';

import * as logger from './logger';

describe('config/logger', function() {

  describe('schema', function() {

    let loggerSchema;

    before(function() {
      loggerSchema = logger.schema();
    });

    it('should return a joi object', function() {
      assert.isObject(loggerSchema);
    });

    it('should validate the conf object', function() {

      joiassert.equal(
        loggerSchema,
        { LOG_LEVEL: 'warn', LOGGING_ENABLED: false },
        { LOG_LEVEL: 'warn', LOGGING_ENABLED: false }
      );

    });

    it('should honor the default values', function() {

      joiassert.equal(
        loggerSchema,
        {},
        { LOG_LEVEL: 'info', LOGGING_ENABLED: true }
      );
    
    });

    it('should throw exception on invalid LOG_LEVEL', function() {
      
      joiassert.error(
        loggerSchema,
        {LOG_LEVEL: 'test', LOGGING_ENABLED: 'test'},
        /\"LOG_LEVEL\" fails/
      );

      joiassert.error(
        loggerSchema,
        {LOG_LEVEL: true, LOGGING_ENABLED: 'test'},
        /\"LOG_LEVEL\" fails/
      );

    });

    it('should throw exception on invalid LOGGING_ENABLED', function() {
      
      joiassert.error(
        loggerSchema,
        { LOGGING_ENABLED: 'test' },
        /\"LOGGING_ENABLED\" fails/
      );

    });

  });

  describe('extract', function() {

    it('should return the conf object', function() {
      
      const expectedResult = {logger: {level: 'warn', isEnabled: false}};
      const config = logger.extract({ LOG_LEVEL: 'warn', LOGGING_ENABLED: false });

      assert.deepEqual(config, expectedResult);

    });

  });

});
