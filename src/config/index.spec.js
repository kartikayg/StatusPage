import {assert} from 'chai';
import base from './index';

describe('config', function() {

  const testEnv = {
    PORT: 1234,
    LOGGING_ENABLED: true,
    LOG_LEVEL: 'info',
    MONGO_ENDPOINT: 'mongodb://dave:password@localhost:27017/myproject'
  };

  it('should return a proper object on success', function() {
    
    const expectedConfig = {
      server: {
        port: testEnv.PORT
      },
      logger: {
        level: testEnv.LOG_LEVEL,
        isEnabled: testEnv.LOGGING_ENABLED
      },
      db: {
        mongo_url: testEnv.MONGO_ENDPOINT
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