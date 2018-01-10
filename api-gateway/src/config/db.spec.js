/**
 * TESTING JOI OBJECT - the idea is to test that the rules set in JOI schema
 * are correct or not.
 */


import {assert} from 'chai';
import joiassert from '../../test/joi-assert';

import {schema} from './db';

const testRedisUrl = 'tcp://redis:6043';

describe('config/db', function() {

  describe('schema', function() {

    it('should return a joi object', function() {
      assert.isObject(schema);
    });

    it('should validate the conf object', function() {
      const o = { REDIS_ENDPOINT: testRedisUrl };
      joiassert.equal(schema, o, o);
    });

    it('should throw exception on missing/invalid REDIS_ENDPOINT', function() {
      joiassert.error(schema, {}, '"REDIS_ENDPOINT" is required');
      joiassert.error(schema, { REDIS_ENDPOINT: 1234 }, '"REDIS_ENDPOINT" must be a string');
    });

  });

});
