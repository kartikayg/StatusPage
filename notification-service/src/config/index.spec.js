/**
 * Testing to see that the conf is loaded and returned properly.
 */

import {assert} from 'chai';
import base from './index';

describe('config/index', function() {

  const testEnv = {
    NODE_ENV: 'development',
    PORT: 1234,
    LOG_LEVEL: 'info',
    ENABLE_HTTP_REQUEST_LOGS: "false",
    MONGO_ENDPOINT: 'mongodb://dave:password@localhost:27017/myproject',
    RABBMITMQ_CONN_ENDPOINT: 'amqp://localhost',
    SMTP_HOST_NAME: 'smtp.mailtrap.io',
    SMTP_PORT: 1234,
    SMTP_USERNAME: 'username',
    SMTP_PASSWORD: 'password',
    SYSTEM_EMAIL_FROM_ADDRESS: 'admin@site.com',
    COMPANY_NAME: 'test',
    UI_APP_URI: 'http://ui_app'
  };

  it('should return a proper object on success', function() {
    
    const expectedConfig = {
      server: {
        PORT: testEnv.PORT,
        NODE_ENV: testEnv.NODE_ENV,
        RABBMITMQ_CONN_ENDPOINT: testEnv.RABBMITMQ_CONN_ENDPOINT,
        ENABLE_HTTP_REQUEST_LOGS: false,
        UI_APP_URI: 'http://ui_app'
      },
      logger: {
        LOG_LEVEL: testEnv.LOG_LEVEL
      },
      db: {
        MONGO_ENDPOINT: testEnv.MONGO_ENDPOINT
      },
      email: {
        SMTP_HOST_NAME: testEnv.SMTP_HOST_NAME,
        SMTP_PORT: testEnv.SMTP_PORT,
        SMTP_USERNAME: testEnv.SMTP_USERNAME,
        SMTP_PASSWORD: testEnv.SMTP_PASSWORD,
        SYSTEM_EMAIL_FROM_ADDRESS: testEnv.SYSTEM_EMAIL_FROM_ADDRESS,
        COMPANY_NAME: testEnv.COMPANY_NAME
      }
    };

    const conf = base.load(testEnv);
    assert.deepEqual(conf, expectedConfig);

    // test that it is also set locally also in config package
    assert.deepEqual(conf, base.conf);

  });

  it ('should ignore extra env vars', function() {

    const extraVars = Object.assign({extra: 123}, testEnv);
    const conf = base.load(testEnv);

    assert.notExists(conf.extra);

  });

  it ('should throw exception when required env variables not passed', function() {
    assert.throws(() => base.load(), Error, /Config validation error/);
  });

});