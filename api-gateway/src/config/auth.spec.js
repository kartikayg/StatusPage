/**
 * TESTING JOI OBJECT - the idea is to test that the rules set in JOI schema
 * are correct or not.
 */


import {assert} from 'chai';
import joiassert from '../../test/joi-assert';

import {schema} from './auth';

describe('config/auth', function() {

  describe('schema', function() {

    it('should return a joi object', function() {
      assert.isObject(schema);
    });

    it('should validate the conf object', function() {

      const o = {
        JWT_SECRET_KEY: 'secret key',
        ADMIN_USERNAME: 'username',
        ADMIN_PASSWORD: 'password'
      };

      joiassert.equal(schema, o, o);

    });

    it('should throw exception on required fields', function() {
      
      const reqFields = ['JWT_SECRET_KEY', 'ADMIN_USERNAME', 'ADMIN_PASSWORD'];
      const requiredErr = reqFields.map(f => `"${f}" is required`);

      joiassert.error(schema, {}, requiredErr);

    });

  });

});