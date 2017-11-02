import {assert} from 'chai';
import sinon from 'sinon';
import mockery from 'mockery';


describe('server/middleware/log-request', function() {

  // need to mock winston and the logger object under it

  // mock the winston.Logger
  const addSpy = sinon.spy();
  const logSpy = sinon.spy();
  const loggerMock = function(level) {
    return {
      add: addSpy,
      log: logSpy
    }
  };

  // mock winston
  const winstonMock = {
    transports: { Console: function () {}, DailyRotateFile: function () {} },
    Logger: loggerMock
  };

  // spy winston.logger
  const loggerSpy = sinon.spy(winstonMock, 'Logger');



  let logRequest;

  before(function() {
    mockery.enable({ warnOnUnregistered: false });
    mockery.registerMock('winston', winstonMock);
    mockery.registerMock('winston-daily-rotate-file', {});

    // loading module here so that the mockery is all setup. if loading before,
    // then mocking winston won't work.
    delete require.cache[require.resolve('./log-request')];
    logRequest = require('./log-request');

  });

  after(function() {
    mockery.disable();
    delete require.cache[require.resolve('./log-request')];
  });

  beforeEach(function() {
    // reset all spies ..
    addSpy.reset(); logSpy.reset(); loggerSpy.reset();
  });


  /**
   * Test cases
   */

  it ('should initiate logger with level as info', function() {
    
    // no writer added
    logRequest({});
    
    sinon.assert.calledOnce(loggerSpy);
    sinon.assert.calledWith(loggerSpy, {level: 'info'});

    sinon.assert.notCalled(addSpy);

  });

  it ('should add console writer for logging', function() {
    
    logRequest({
      LOG_HTTP_REQUEST_WRITER: 'console'
    });

    sinon.assert.calledOnce(addSpy);
    sinon.assert.calledWith(addSpy, winstonMock.transports.Console);

  });

  it ('should add file writer for logging', function() {
    
    logRequest({
      LOG_HTTP_REQUEST_WRITER: 'file',
      LOG_HTTP_REQUEST_DIRNAME: 'dir',
      LOG_HTTP_REQUEST_PREFIX: 'prefix'
    });

    sinon.assert.calledOnce(addSpy);
    sinon.assert.calledWith(addSpy, winstonMock.transports.DailyRotateFile);

    assert.strictEqual(addSpy.args[0][1].dirname, 'dir');
    assert.strictEqual(addSpy.args[0][1].filename, 'prefix');

  });

  it ('should add default file name prefix for file writer', function() {
    
    logRequest({
      LOG_HTTP_REQUEST_WRITER: 'file',
      LOG_HTTP_REQUEST_DIRNAME: 'dir'
    });

    sinon.assert.calledOnce(addSpy);
    sinon.assert.calledWith(addSpy, winstonMock.transports.DailyRotateFile);

    assert.strictEqual(addSpy.args[0][1].dirname, 'dir');
    assert.strictEqual(addSpy.args[0][1].filename, 'request');

  });

  it ('should call winston logger log when executing the morgan call', function() {

    logRequest({
      LOG_HTTP_REQUEST_WRITER: 'console'
    }, true)({headers: {}}, {}, function() {});

    sinon.assert.calledOnce(logSpy);

  });

  it ('should not call winston logger log when immediate is false', function() {

    logRequest({
      LOG_HTTP_REQUEST_WRITER: 'console'
    }, false)({headers: {}}, {}, function() {});

    sinon.assert.notCalled(logSpy);

  });

});