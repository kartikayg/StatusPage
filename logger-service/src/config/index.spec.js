/**
 * Testing to see that the conf is loaded and returned properly.
 */


import {assert} from 'chai';
import config from './index';

describe('config', function() {

  const testEnv = {
    PORT: 1234,
    NODE_ENV: 'development', 
    RABBMITMQ_CONN_ENDPOINT: 'amqp://localhost' ,

    LOG_LEVEL: 'warn', 

    LOG_REQUEST_WRITER: ['file'],
    LOG_APPLICATION_WRITER: ['file', 'console'],

    LOG_FILE_DIRNAME: 'dir/data'
  };

  it('should return a proper object on success', function() {
    
    const expectedConfig = {
      server: {
        PORT: 1234,
        NODE_ENV: 'development', 
        RABBMITMQ_CONN_ENDPOINT: 'amqp://localhost' ,
      },
      logger: {
        LOG_LEVEL: 'warn', 

        LOG_REQUEST_WRITER: ['file'],
        LOG_APPLICATION_WRITER: ['file', 'console'],

        LOG_FILE_DIRNAME: 'dir/data'
      }
    };

    const conf = config.load(testEnv);
    assert.deepEqual(conf, expectedConfig);

  });

   it('should ignore extra env vars', function() {

    const extraVars = Object.assign({extra: 123}, testEnv);
    const conf = config.load(testEnv);

    assert.notExists(conf.extra);

  });

  it('should throw exception when required env variables not passed', function() {
    assert.throws(() => config.load(), Error, /Config validation error/);
  });

});