/**
 * Testing to see if we are sending the log messages to the messaging queue
 * with the right parameters.
 *
 * Note: There is no actual messaging queue operations happening as we have stubbed
 * the queue.
 */

import {assert} from 'chai';
import sinon from 'sinon';

describe ('lib/logger', function () {

  let allowedLevels;
  let defaultLogger;
  let initMQLogger;

  // stub for the messaging queue
  const messagingQueueStub = {
    publish: sinon.spy()
  };

  before(function() {

    // clear the cache to get a fresh object
    delete require.cache[require.resolve('./logger')];
    
    defaultLogger = require('./logger').default;
    allowedLevels = require('./logger').allowedLevels;
    initMQLogger    = require('./logger').initMQLogger;

  });

  after(function() {
    delete require.cache[require.resolve('./logger')];
  });

  beforeEach(function() {
    // reset all spies ..
    messagingQueueStub.publish.reset();
  });

  it ('should return a default logger', function () {

    assert.isObject(defaultLogger);

    assert.isFunction(defaultLogger.log);
    assert.isFunction(defaultLogger.error);
    assert.isFunction(defaultLogger.warn);
    assert.isFunction(defaultLogger.info);
    assert.isFunction(defaultLogger.debug);

  });

  it ('should return the allowed levels', function () {
    assert.deepEqual(allowedLevels, ['error', 'warn', 'info', 'debug']);
  });



  it ('should create a new messaginig queue logger', function() {

    const logger = initMQLogger('debug', messagingQueueStub);

    assert.isObject(logger);

    assert.isFunction(logger.log);
    assert.isFunction(logger.error);
    assert.isFunction(logger.warn);
    assert.isFunction(logger.info);
    assert.isFunction(logger.debug);

  });

  it ('should publish on queue when logging a message', function () {

    const logger = initMQLogger('debug', messagingQueueStub);

    const meta = { timestamp : (new Date()).toISOString() };
    logger.log('error', 'message', meta);

    sinon.assert.calledOnce(messagingQueueStub.publish);

    const expectedMeta = Object.assign({}, meta, { serviceName: process.env.SERVICE_NAME });

    const logParam = {
      level: 'error',
      message: 'message',
      meta: expectedMeta      
    };

    sinon.assert.calledWith(messagingQueueStub.publish, logParam, 'logs', { routingKey: 'app' });

  });

  it ('should be defaulting serviceName and timestamp if not passed', function () {

    const logger = initMQLogger('debug', messagingQueueStub);
    logger.log('error', 'message');

    const metaArgs = messagingQueueStub.publish.args[0][0].meta;

    assert.strictEqual(metaArgs.serviceName, process.env.SERVICE_NAME);
    assert.isString(metaArgs.timestamp);

  });

  it ('should log if the level of message is below the max level allowed', function () {

    const logger = initMQLogger('info', messagingQueueStub);
    logger.log('warn', 'message');

    sinon.assert.calledOnce(messagingQueueStub.publish);

  });

  it ('should not log if the level of message is above the max level allowed', function () {

    const logger = initMQLogger('warn', messagingQueueStub);
    logger.log('debug', 'message');

    sinon.assert.notCalled(messagingQueueStub.publish);

  });

  it ('should create a proper object when logging error', function () {

    const logger = initMQLogger('error', messagingQueueStub);

    const e = new Error('test123');
    const meta = {
      stack: e.stack,
      code: 500,
      name: e.name,
      isError: true,
      test: 'hello',
      serviceName: process.env.SERVICE_NAME,
      timestamp: (new Date()).toISOString()
    };

    logger.error(e, {test: 'hello', timestamp: meta.timestamp});
    sinon.assert.calledOnce(messagingQueueStub.publish);

    const logParam = {
      level: 'error',
      message: 'test123',
      meta
    }

    sinon.assert.calledWith(messagingQueueStub.publish, logParam);

  });

  it ('should stringify the object before logging', function() {

    const message = { message: 'test123'};
    const logger = initMQLogger('debug', messagingQueueStub);

    const meta = {timestamp : (new Date()).toISOString(), serviceName: process.env.SERVICE_NAME };

    logger.warn(message, meta);

    sinon.assert.calledOnce(messagingQueueStub.publish);

    const logParam = {
      level: 'warn',
      message: JSON.stringify(message),
      meta
    }

    sinon.assert.calledWith(messagingQueueStub.publish, logParam);

  });


  it ('should call log() with debug level', function() {

    const logger = initMQLogger('debug', messagingQueueStub);
    const logSpy = sinon.spy(logger, 'log');

    const message = 'test123';
    const meta = {m: 'meta'};
    logger.debug(message, meta);

    sinon.assert.calledOnce(logSpy);
    sinon.assert.calledWith(logSpy, 'debug', message, meta);

    logSpy.restore();

  });

  it ('should call log() with info level', function() {

    const logger = initMQLogger('info', messagingQueueStub);

    const logSpy = sinon.spy(logger, 'log');

    const message = 'test123';
    const meta = {m: 'meta'};
    logger.info(message, meta);

    sinon.assert.calledOnce(logSpy);
    sinon.assert.calledWith(logSpy, 'info', message, meta);

    logSpy.restore();

  });

  it ('should call log() with warn level', function() {

    const logger = initMQLogger('warn', messagingQueueStub);

    const logSpy = sinon.spy(logger, 'log');

    const message = 'test123';
    const meta = {m: 'meta'};
    logger.warn(message, meta);

    sinon.assert.calledOnce(logSpy);
    sinon.assert.calledWith(logSpy, 'warn', message, meta);

    logSpy.restore();

  });


  it ('should call log() with error level', function() {

    const logger = initMQLogger('error', messagingQueueStub);

    const logSpy = sinon.spy(logger, 'log');

    const message = 'test123';
    const meta = {m: 'meta'};
    logger.error(message, meta);

    sinon.assert.calledOnce(logSpy);
    sinon.assert.calledWith(logSpy, 'error', message, meta);

    logSpy.restore();

  });

  it ('should update the default logger', function () {
    const logger = initMQLogger('error', messagingQueueStub, true);
    assert.deepEqual(defaultLogger, logger);
  });

});
