import {assert} from 'chai';
import joiassert from '../../test/joi-assert';

import {schema} from './logger';

describe('config/logger', function() {

  const data = {
    LOG_LEVEL: 'warn', 

    LOG_REQUEST_WRITER: ['file'],
    LOG_APPLICATION_WRITER: ['file', 'console'],

    LOG_FILE_DIRNAME: 'dir/data'
  };

  it ('should return a joi object', function() {
    assert.isObject(schema);
  });

  it ('should validate the conf object', function() {
    joiassert.equal(schema, data, data);
  });

  it ('should return no error on empty data as nothing is required', function() {
    joiassert.equal(schema, {}, { LOG_LEVEL : 'error'} );
  });

  it ('should return error for invalid log level', function() {
    joiassert.error(schema, { LOG_LEVEL: 'test' }, '"LOG_LEVEL" must be one of [error, warn, info, debug]');
  });

  it ('should return error for invalid log writer', function() {
    
    joiassert.error(
      schema,
      { LOG_REQUEST_WRITER: ['test', 'file'] },
      '"LOG_REQUEST_WRITER" must be one of [console, file]'
    );

    joiassert.error(
      schema,
      { LOG_APPLICATION_WRITER: ['test', 'console'] },
      '"LOG_APPLICATION_WRITER" must be one of [console, file]'
    );

  });

  it ('should return error for invalid file dir name', function() {
    joiassert.error(schema, { LOG_FILE_DIRNAME: 123 }, '"LOG_FILE_DIRNAME" must be a string');
  });

});
