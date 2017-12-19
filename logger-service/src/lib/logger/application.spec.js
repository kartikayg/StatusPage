/**
 * Testing to see if we are sending the log messages to the winston logger
 * with the right parameters.
 *
 * Note: There is no actual logging happening as we have stubbed winston logger
 */


import {assert} from 'chai';
import sinon from 'sinon';
import mockery from 'mockery';

describe ('lib/logger/application', function () {

  // mock the winston library
  const addSpy = sinon.spy();
  const logSpy = sinon.spy();

  const winstonMock = {
    transports: { Console: function () {}, DailyRotateFile: function () {} },
    Logger: function(level) {
      return { add: addSpy, log: logSpy, clear: sinon.spy() }
    }
  };

  const loggerSpy = sinon.spy(winstonMock, 'Logger');

  let allowedLevels;
  let initAppLogger;
  let defaultLogger;

  // on before, setup mockery
  before(function() {
    mockery.enable({ warnOnUnregistered: false });
    mockery.registerMock('winston', winstonMock);
    mockery.registerMock('winston-daily-rotate-file', {});

    // loading module here so that the mockery is all setup. if loading before,
    // then mocking winston won't work.
    delete require.cache[require.resolve('./application')];
    
    defaultLogger = require('./application').default;
    allowedLevels = require('./application').allowedLevels;
    initAppLogger = require('./application').init;

  });

  // mockery done
  after(function() {
    mockery.deregisterMock('winston');
    mockery.deregisterMock('winston-daily-rotate-file');
    mockery.disable();
    delete require.cache[require.resolve('./application')];
  });

  beforeEach(function() {
    // reset all spies ..
    addSpy.reset(); logSpy.reset(); loggerSpy.reset();
  });

  it ('should return a default logger', function () {
    assert.isObject(defaultLogger);
    assert.strictEqual(defaultLogger.level, 'error');

    assert.isFunction(defaultLogger.log);
    assert.isFunction(defaultLogger.error);
    assert.isFunction(defaultLogger.warn);
    assert.isFunction(defaultLogger.info);
    assert.isFunction(defaultLogger.debug);

  });

  it ('should return the allowed levels', function () {
    assert.deepEqual(allowedLevels, ['error', 'warn', 'info', 'debug']);
  });

  it ('should create a new winston logger', function() {

    const logger = initAppLogger('debug', []);

    sinon.assert.calledOnce(loggerSpy);
    sinon.assert.calledWith(loggerSpy, {level: 'debug'});

  });

  it ('should only add console writer', function () {
  
    const logger = initAppLogger('debug', ['console']);

    sinon.assert.calledOnce(addSpy);
    sinon.assert.calledWith(addSpy, winstonMock.transports.Console);

  });

  it ('should only add file writer', function () {

    const logger = initAppLogger('debug', ['file'], {file: {dirname: 'dir'}});

    sinon.assert.calledOnce(addSpy);
    sinon.assert.calledWith(addSpy, winstonMock.transports.DailyRotateFile);

  });

  it ('should add both (file and console) writers', function () {

    const logger = initAppLogger('debug', ['file', 'console'], {file: {dirname: 'dir'}});

    sinon.assert.calledTwice(addSpy);
    sinon.assert.calledWith(addSpy, winstonMock.transports.Console);
    sinon.assert.calledWith(addSpy, winstonMock.transports.DailyRotateFile);

  });

  it ('should add both (file and console) writers', function () {

    const logger = initAppLogger('debug', ['file', 'console'], {file: {dirname: 'dir'}});

    sinon.assert.calledTwice(addSpy);
    sinon.assert.calledWith(addSpy, winstonMock.transports.Console);
    sinon.assert.calledWith(addSpy, winstonMock.transports.DailyRotateFile);

  });

  it ('should log if the level of message is below the max level allowed', function () {

    const logger = initAppLogger('debug', []);
    logger.warn('message');

    sinon.assert.calledOnce(logSpy);

  });

  it ('should not log if the level of message is above the max level allowed', function () {

    const logger = initAppLogger('error', []);
    logger.warn('message');

    sinon.assert.notCalled(logSpy);

  });

  it ('should create a proper object when logging error', function () {

    const logger = initAppLogger('error', []);

    const e = new Error('test123');
    const meta = {
      stack: e.stack,
      code: 500,
      name: e.name,
      isError: true,
      test: 'hello',
      serviceName: 'logger-service'
    };

    logger.error(e, {test: 'hello'});
    sinon.assert.calledOnce(logSpy);
    sinon.assert.calledWith(logSpy, 'error', 'test123', meta);

  });

  it ('should stringify the object before logging', function() {

    const message = { message: 'test123'};
    const logger = initAppLogger('debug', []);

    logger.warn(message);

    sinon.assert.calledOnce(logSpy);
    sinon.assert.calledWith(logSpy, 'warn', JSON.stringify(message), {serviceName: 'logger-service'});

  });


 it ('should call winston logger debug', function() {
    const message = 'test123';
    const logger = initAppLogger('debug', []);

    logger.debug(message, {serviceName: 'serviceName'});
    sinon.assert.calledOnce(logSpy);
    sinon.assert.calledWith(logSpy, 'debug', message, {serviceName: 'serviceName'});
  });

  it ('should call winston logger info', function() {

    const message = 'test123';
    const logger = initAppLogger('info', []);

    logger.info(message, {serviceName: 'serviceName'});
    sinon.assert.calledOnce(logSpy);
    sinon.assert.calledWith(logSpy, 'info', message, {serviceName: 'serviceName'});

  });

  it ('should call winston logger warn log', function () {

    const message = 'test123';
    const logger = initAppLogger('warn', []);

    logger.warn(message, {serviceName: 'serviceName'});
    sinon.assert.calledOnce(logSpy);
    sinon.assert.calledWith(logSpy, 'warn', message, {serviceName: 'serviceName'});

  });

  it ('should update the default logger', function () {
    const logger = initAppLogger('warn', [], {}, true);
    assert.deepEqual(defaultLogger, logger);
  });

});
