import {assert} from 'chai';
import base from './index';

describe('config', function() {

  const testEnv = {
    NODE_ENV: 'development',
    PORT: 1234,
    LOG_CONSOLE_LEVEL: 'info',
    LOG_DB_LEVEL: 'error',
    LOG_FILE_LEVEL: 'warn',
    LOG_FILE_DIRNAME: 'logs/',
    MONGO_ENDPOINT: 'mongodb://dave:password@localhost:27017/myproject'
  };

  it('should return a proper object on success', function() {
    
    const expectedConfig = {
      server: {
        PORT: testEnv.PORT,
        NODE_ENV: testEnv.NODE_ENV
      },
      logger: {
        LOG_CONSOLE_LEVEL: testEnv.LOG_CONSOLE_LEVEL,
        LOG_DB_LEVEL: testEnv.LOG_DB_LEVEL,
        LOG_FILE_LEVEL: testEnv.LOG_FILE_LEVEL,
        LOG_FILE_DIRNAME: testEnv.LOG_FILE_DIRNAME
      },
      db: {
        MONGO_ENDPOINT: testEnv.MONGO_ENDPOINT
      }
    };

    const conf = base.load(testEnv);
    assert.deepEqual(conf, expectedConfig);

  });

   it('should ignore extra env vars', function() {

    const extraVars = Object.assign({extra: 123}, testEnv);
    const conf = base.load(testEnv);

    assert.notExists(conf.extra);

  });

  it('should throw exception when required env variables not passed', function() {
    assert.throws(() => base.load(), Error, /Config validation error/);
  });

});