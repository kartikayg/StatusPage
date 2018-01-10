/**
 * Testing to see that the conf is loaded and returned properly.
 */

import {assert} from 'chai';
import base from './index';

describe('config', function() {

  const testEnv = {
    NODE_ENV: 'development',
    PORT: 1234,
    LOG_LEVEL: 'info',
    ENABLE_HTTP_REQUEST_LOGS: "false",
    REDIS_ENDPOINT: 'tcp://redis:6043',
    RABBMITMQ_CONN_ENDPOINT: 'amqp://localhost',
    JWT_SECRET_KEY: 'secret key',
    ADMIN_USERNAME: 'username',
    ADMIN_PASSWORD: 'password'
  };

  it('should return a proper object on success', function() {
    
    const expectedConfig = {
      server: {
        PORT: testEnv.PORT,
        NODE_ENV: testEnv.NODE_ENV,
        RABBMITMQ_CONN_ENDPOINT: testEnv.RABBMITMQ_CONN_ENDPOINT,
        ENABLE_HTTP_REQUEST_LOGS: false
      },
      logger: {
        LOG_LEVEL: testEnv.LOG_LEVEL
      },
      db: {
        REDIS_ENDPOINT: testEnv.REDIS_ENDPOINT
      },
      auth: {
        JWT_SECRET_KEY: testEnv.JWT_SECRET_KEY,
        ADMIN_USERNAME: testEnv.ADMIN_USERNAME,
        ADMIN_PASSWORD: testEnv.ADMIN_PASSWORD
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