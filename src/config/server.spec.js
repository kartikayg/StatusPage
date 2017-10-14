import {assert} from 'chai';
import joiassert from '../../test/joi-assert';

import {schema} from './server';

describe('config/server', function() {

  describe('schema', function() {

    it('should return a joi object', function() {
      assert.isObject(schema);
    });

    it('should validate the conf object', function() {

      joiassert.equal(
        schema, 
        { PORT: 1234, NODE_ENV: 'development' },
        { PORT: 1234, NODE_ENV: 'development' }
      );

    });

    it('should throw exception on missing/invalid PORT number', function() {
      
      joiassert.error(
        schema, 
        {},
        ['"NODE_ENV" is required', '"PORT" is required']
      );

      joiassert.error(
        schema, 
        { PORT: "test", NODE_ENV: 'production' },
        '"PORT" must be a number'
      );

    });

  });

});