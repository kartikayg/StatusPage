/**
 * TESTING JOI OBJECT - the idea is to test that the rules set in JOI schema
 * are correct or not.
 */

import {assert} from 'chai';
import joiassert from '../../test/joi-assert';

import {schema} from './logger';

describe('config/logger', function() {

  describe('schema', function() {

    it('should return a joi object', function() {
      assert.isObject(schema);
    });

    it('should validate the conf object', function() {

      const input = {
        LOG_LEVEL: 'debug'
      };

      const output = {
        LOG_LEVEL: 'debug'
      };

      joiassert.equal(schema, input, output);

    });

    it ('should throw error on invalid log level', function () {

      joiassert.error(
        schema,
        { LOG_LEVEL: 'yes' },
        [
          '"LOG_LEVEL" must be one of [error, warn, info, debug]'
        ]
      );

    });
    
  });

});
