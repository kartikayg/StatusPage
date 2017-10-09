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
        { CONSOLE_LOG_LEVEL: 'warn', DB_LOG_LEVEL: 'error' },
        { CONSOLE_LOG_LEVEL: 'warn', DB_LOG_LEVEL: 'error' }
      );

    });

    it('should honor the optional flag', function() {

      joiassert.equal(
        loggerSchema,
        { CONSOLE_LOG_LEVEL: 'warn' },
        { CONSOLE_LOG_LEVEL: 'warn' }
      );

      joiassert.equal(
        loggerSchema,
        { DB_LOG_LEVEL: 'warn' },
        { DB_LOG_LEVEL: 'warn' }
      );

    });

    it ('should throw error on invalid data', function() {

      joiassert.error(
        loggerSchema,
        { CONSOLE_LOG_LEVEL: 'yes', DB_LOG_LEVEL: 'no' },
        [
          '"CONSOLE_LOG_LEVEL" must be one of [error, warn, info, debug]',
          '"DB_LOG_LEVEL" must be one of [error, warn, info, debug]'
        ]
      );

    });
    
  });

  describe('extract', function() {

    it('should return the conf object', function() {
      
      const expectedResult = {logger: {console: 'warn', db: 'error'}};
      const config = logger.extract({ CONSOLE_LOG_LEVEL: 'warn', DB_LOG_LEVEL: 'error' });

      assert.deepEqual(config, expectedResult);

    });

  });

});
