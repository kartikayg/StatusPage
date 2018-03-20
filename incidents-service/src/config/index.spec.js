import {assert} from 'chai';
import base from './index';

describe('config', function() {

  const testEnv = {
    NODE_ENV: 'development',
    PORT: 1234,
    LOG_LEVEL: 'info',
    ENABLE_HTTP_REQUEST_LOGS: "false",
    MONGO_ENDPOINT: 'mongodb://dave:password@localhost:27017/myproject',
    RABBMITMQ_CONN_ENDPOINT: 'amqp://localhost',
    COMPONENTS_SERVICE_URI: 'http://uri'
  };

  it('should return a proper object on success', function() {
    
    const expectedConfig = {
      server: {
        PORT: testEnv.PORT,
        NODE_ENV: testEnv.NODE_ENV,
        RABBMITMQ_CONN_ENDPOINT: testEnv.RABBMITMQ_CONN_ENDPOINT,
        ENABLE_HTTP_REQUEST_LOGS: false,
        COMPONENTS_SERVICE_URI: 'http://uri'
      },
      logger: {
        LOG_LEVEL: testEnv.LOG_LEVEL
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