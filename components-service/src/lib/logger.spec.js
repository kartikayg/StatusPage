import {assert} from 'chai';
import sinon from 'sinon';
import winston from 'winston';
import 'winston-mongodb';

import * as logger from './logger';

describe('lib/logger', function() {

  describe ('init writers', function() {
    
    const clearStub = sinon.stub(winston, 'clear');
    const addStub = sinon.stub(winston, 'add');

    beforeEach(function() {
      addStub.reset(); clearStub.reset();
    });

    after(function() {
      addStub.restore(); clearStub.restore();
    });


    it ('should clear all writers initially', function() {
      logger.initWriters({}, {});
      sinon.assert.calledOnce(clearStub);
    });

    it ('should setup the console writer based on conf', function() {

      logger.initWriters({ LOG_CONSOLE_LEVEL: 'info' });

      sinon.assert.calledOnce(addStub);
      sinon.assert.calledWith(addStub, winston.transports.Console);

      // options passed to the add(). we are not going to compare each property
      // but only what is passed .
      const options = addStub.args[0][1];

      assert.strictEqual(options.level, 'info');

    });

    it ('should setup the db writer based on conf', function() {

      require('winston-mongodb');

      const db = {};

      logger.initWriters({ LOG_DB_LEVEL: 'error' }, { db });

      sinon.assert.calledOnce(addStub);
      sinon.assert.calledWith(addStub, winston.transports.MongoDB);

      // options passed to the add(). we are not going to compare each property
      // but only what is passed .
      const options = addStub.args[0][1];

      assert.strictEqual(options.level, 'error');
      assert.strictEqual(options.db, db);

    });

    it ('should error out when no db is passed for db writer setup', function(done) {

      try {
        logger.initWriters({ LOG_DB_LEVEL: 'error' }, {});
      }
      catch (e) {
        sinon.assert.notCalled(addStub);
        assert.strictEqual(e.message, 'A Db object is required to setup this writer.');
        done();
      }

    });

    it ('should setup the file writer based on conf', function() {

      require('winston-daily-rotate-file');

      logger.initWriters({ LOG_FILE_LEVEL: 'debug', LOG_FILE_DIRNAME: 'dir', LOG_FILE_PREFIX: 'file' });

      sinon.assert.calledOnce(addStub);
      sinon.assert.calledWith(addStub, winston.transports.DailyRotateFile);

      // options passed to the add(). we are not going to compare each property
      // but only what is passed .
      const options = addStub.args[0][1];

      assert.strictEqual(options.level, 'debug');
      assert.strictEqual(options.dirname, 'dir');
      assert.strictEqual(options.filename, 'file');

    });

    it ('should error out when no file dir is passed for file writer setup', function(done) {

      try {
        logger.initWriters({ LOG_FILE_LEVEL: 'error' });
      }
      catch (e) {
        sinon.assert.notCalled(addStub);
        assert.strictEqual(e.message, 'A file directory is required to setup this writer.');
        done();
      }

    });

    it ('should setup multiple writers', function() {

      require('winston-mongodb');

      logger.initWriters({ LOG_CONSOLE_LEVEL: 'info', LOG_DB_LEVEL: 'error'  }, { db: {} });

      sinon.assert.calledTwice(addStub);
      sinon.assert.calledWith(addStub, winston.transports.Console);
      sinon.assert.calledWith(addStub, winston.transports.MongoDB);

    });

  });

  describe('log methods', function() {

    let logStub = sinon.stub(winston, 'log');

    beforeEach(function() {
      logStub.reset();
    });

    after(function() {
      logStub.restore();
    });

    it('log()', function() {

      const message = 'test123';

      logger.log('warn', message);
      sinon.assert.calledOnce(logStub);
      sinon.assert.calledWith(logStub, 'warn', message, {});

    });

    it('log error', function() {

      const e = new Error('test123');

      const meta = {
        stack: e.stack,
        code: 500,
        name: e.name,
        isError: true,
        test: 'hello'
      };

      logger.log('error', e, {test: 'hello'});
      sinon.assert.calledOnce(logStub);
      sinon.assert.calledWith(logStub, 'error', 'test123', meta);

    });

    it('debug()', function() {

      const message = 'test123';

      logger.debug(message, {test: 'hello'});

      sinon.assert.calledOnce(logStub);
      sinon.assert.calledWith(logStub, 'debug', message, {test: 'hello'});

    });

    it('info()', function() {

      const message = 'test123';

      logger.info(message);

      sinon.assert.calledOnce(logStub);
      sinon.assert.calledWith(logStub, 'info', message, {});

    });

    it('warn() an object, should be stringify before logging', function() {

      const message = { message: 'test123'};

      logger.warn(message);

      sinon.assert.calledOnce(logStub);
      sinon.assert.calledWith(logStub, 'warn', JSON.stringify(message), {});

    });

    it('error()', function() {

      const message = 'test123';

      logger.error(message);

      sinon.assert.calledOnce(logStub);
      sinon.assert.calledWith(logStub, 'error', message, {});

    });

    it('log to console', function() {

      // we want the log to happen, so remove the stub
      logStub.restore();

      const writeOutSpy = sinon.spy(process.stdout, 'write');
      const writeErrSpy = sinon.spy(process.stderr, 'write');

      logger.initWriters({ LOG_CONSOLE_LEVEL: 'info' });
      logger.info('this is info.');
      logger.error('this is a error', {error: new Error('test')});

      sinon.assert.calledOnce(writeErrSpy);
      sinon.assert.calledOnce(writeOutSpy);

      writeOutSpy.restore();
      writeErrSpy.restore();

    });

  });

});