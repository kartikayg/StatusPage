import {assert} from 'chai';
import joiassert from '../../test/joi-assert';

import * as server from './server';

describe('config/server', function() {

  describe('schema', function() {

    let serverSchema;

    before(function() {
      serverSchema = server.schema();
    });

    it('should return a joi object', function() {
      assert.isObject(serverSchema);
    });

    it('should validate the conf object', function() {

      joiassert.equal(serverSchema, { PORT: 1234 }, { PORT: 1234 });

    });

    it('should throw exception on missing/invalid PORT number', function() {
      
      joiassert.error(serverSchema, {}, /\"PORT\" is required/);
      joiassert.error(serverSchema, { PORT: "test" }, /\"PORT\" must be a number/);

    });

  });

  describe('extract', function() {

    it('should return the conf object', function() {
      
      const expectedResult = {server: {port: 1234}};
      const config = server.extract({ PORT: 1234 });

      assert.deepEqual(config, expectedResult);

    });

  });

});