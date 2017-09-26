import {assert} from 'chai';
import logger from './logger';

describe('config/logger', function() {

  it ('should return a proper object on success', function() {

    const conf = logger.load();

    assert.isObject(conf);
    assert.isObject(conf.logger);

    assert.isString(conf.logger.level);
    assert.isBoolean(conf.logger.isEnabled);

  });

  it('should honor default values', function() {

    const conf = logger.load().logger;

    assert.strictEqual(conf.level, 'info');
    assert.strictEqual(conf.isEnabled, true);

  });

  it('should return the values from the object passed in the paramater', function() {

    const conf = logger.load({
      LOG_LEVEL: 'warn',
      LOGGING_ENABLED: false
    }).logger;

    assert.strictEqual(conf.level, 'warn');
    assert.strictEqual(conf.isEnabled, false);
    
  });

  it('should throw exception on invalid LOG_LEVEL', function() {
    assert.throws(() => logger.load({LOG_LEVEL: 'test'}), Error, /"LOG_LEVEL" fails/);
    assert.throws(() => logger.load({LOG_LEVEL: true}), Error, /"LOG_LEVEL" fails/);
  });

  it('should throw exception on invalid LOGGING_ENABLED', function() {
    assert.throws(() => logger.load({LOGGING_ENABLED: 'test'}), Error, /"LOGGING_ENABLED" fails/);
  });

});