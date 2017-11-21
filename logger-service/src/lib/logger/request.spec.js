import {assert} from 'chai';
import sinon from 'sinon';
import mockery from 'mockery';

describe ('lib/logger/request', function () {

  const addSpy = sinon.spy();
  const logSpy = sinon.spy();
  const addColorsSpy = sinon.spy();

  // mock object for winston package
  const WinstonMock = {
    transports: { Console: function () {}, DailyRotateFile: function () {} },
    Logger: function(level) {
      return { add: addSpy, log: logSpy, clear: sinon.spy() }
    },
    addColors: addColorsSpy
  };

  const winstonLoggerObjSpy = sinon.spy(WinstonMock, 'Logger');

  let initLogger;

  // on before, setup mockery
  before(function() {
    mockery.enable({ warnOnUnregistered: false });
    mockery.registerMock('winston', WinstonMock);
    mockery.registerMock('winston-daily-rotate-file', {});

    // loading module here so that the mockery is all setup. if loading before,
    // then mocking winston won't work.
    delete require.cache[require.resolve('./request')];

    initLogger = require('./request').init;

  });

  // mockery done
  after(function() {
    mockery.deregisterMock('winston');
    mockery.deregisterMock('winston-daily-rotate-file');
    mockery.disable();
    delete require.cache[require.resolve('./request')];
  });

  beforeEach(function() {
    // reset all spies ..
    addSpy.reset();
    logSpy.reset();
    winstonLoggerObjSpy.reset();
    addColorsSpy.reset();
  });

  it ('should create a new winston logger', function() {
    const logger = initLogger([]);
    sinon.assert.calledOnce(winstonLoggerObjSpy);
    sinon.assert.calledOnce(addColorsSpy);
  });

  it ('should only add console writer', function () {
  
    const logger = initLogger(['console']);

    sinon.assert.calledOnce(addSpy);
    sinon.assert.calledWith(addSpy, WinstonMock.transports.Console);

  });

  it ('should only add file writer', function () {

    const logger = initLogger(['file'], {file: {dirname: 'dir'}});

    sinon.assert.calledOnce(addSpy);
    sinon.assert.calledWith(addSpy, WinstonMock.transports.DailyRotateFile);

  });

  it ('should add both (file and console) writers', function () {

    const logger = initLogger(['file', 'console'], {file: {dirname: 'dir'}});

    sinon.assert.calledTwice(addSpy);
    sinon.assert.calledWith(addSpy, WinstonMock.transports.Console);
    sinon.assert.calledWith(addSpy, WinstonMock.transports.DailyRotateFile);

  });

  it ('should call winston log when logging request', function () {

    const logger = initLogger([]);

    const req = {url: 'http', headers: {}};
    logger(req);

    sinon.assert.calledOnce(logSpy);
    sinon.assert.calledWith(logSpy, 'httprequest', req);

  });

});
