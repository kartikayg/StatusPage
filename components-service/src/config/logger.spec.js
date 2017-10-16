import {assert} from 'chai';
import joiassert from '../../test/joi-assert';

import {schema} from './logger';

describe('config/logger', function() {

  describe('schema', function() {

    it('should return a joi object', function() {
      assert.isObject(schema);
    });

    it('should validate the conf object', function() {

      const obj1 = {
        LOG_CONSOLE_LEVEL: 'warn', 
        LOG_DB_LEVEL: 'error',
        LOG_FILE_LEVEL: 'info',
        LOG_FILE_DIRNAME: 'dir',
        LOG_FILE_PREFIX: 'log'
      };

      joiassert.equal(schema, obj1, obj1);

    });

    it('should honor the optional flag', function() {

      const obj1 = {
        LOG_CONSOLE_LEVEL: 'warn', 
        LOG_DB_LEVEL: 'error',

      };

      joiassert.equal(schema, obj1, obj1);

      const obj2 = {
        LOG_FILE_LEVEL: 'info',
        LOG_FILE_DIRNAME: 'dir',
        LOG_FILE_PREFIX: 'log'
      };

      joiassert.equal(schema, obj2, obj2);

    });

    it ('should throw error on invalid data', function() {

      joiassert.error(
        schema,
        { LOG_CONSOLE_LEVEL: 'yes', LOG_DB_LEVEL: 'no' },
        [
          '"LOG_CONSOLE_LEVEL" must be one of [error, warn, info, debug]',
          '"LOG_DB_LEVEL" must be one of [error, warn, info, debug]'
        ]
      );

      joiassert.error(
        schema,
        { LOG_FILE_LEVEL: 'warn' },
        '"LOG_FILE_LEVEL" missing required peer "LOG_FILE_DIRNAME"'
      );

    });
    
  });

});
