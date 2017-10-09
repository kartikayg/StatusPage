import {assert} from 'chai';
import sinon from 'sinon';
import winston from 'winston';
import {MongoDB as winstonmongodb} from 'winston-mongodb';

import logger from './logger';

describe('lib/logger', function() {

  describe('log level', function() {

    it('should have the default level as debug', function() {
      assert.strictEqual(logger.level, 'debug');
    });

    it('should update the level if set', function() {
      
      logger.level = 'warn';
      assert.strictEqual(logger.level, 'warn');

      logger.level = 'debug'; // revert back

    });

  });

  describe('writers', function() {

    var addWriterStub;

    beforeEach(function() {
       addWriterStub = sinon.stub(winston, 'add');
    });

    afterEach(function() {
      addWriterStub.restore();
    });


    it('should add the console writer', function() {
    
      logger.addConsoleWriter('warn');

      sinon.assert.calledOnce(addWriterStub);
      sinon.assert.calledWith(
        addWriterStub,
        winston.transports.Console, 
        {
          level: 'warn',
          colorize: true,
          timestamp: true,
          json: true,
          stringify: true
        }
      );

    });

    it('should add the db writer', function() {
      
      const db = {};
      logger.addDbWriter('warn', db);

      sinon.assert.calledOnce(addWriterStub);
      sinon.assert.calledWith(
        addWriterStub,
        winstonmongodb, 
        {
          level: 'warn',
          db,
          storeHost: true,
          capped: true,
          cappedMax: 100000
        }
      );

    });

  });

  describe('log methods', function() {

    it('should call debug() on winston', function() {

      const debugStub = sinon.stub(winston, 'debug');
      const message = 'test123';

      logger.debug(message);

      sinon.assert.calledOnce(debugStub);
      sinon.assert.calledWith(debugStub, message);

      debugStub.restore();

    });

    it('should call info() on winston', function() {

      const infoStub = sinon.stub(winston, 'info');
      const message = 'test123';

      logger.info(message);

      sinon.assert.calledOnce(infoStub);
      sinon.assert.calledWith(infoStub, message);

      infoStub.restore();

    });

    it('should call warn() on winston', function() {

      const warnStub = sinon.stub(winston, 'warn');
      const message = 'test123';

      logger.warn(message);

      sinon.assert.calledOnce(warnStub);
      sinon.assert.calledWith(warnStub, message);

      warnStub.restore();

    });

     it('should call error() on winston', function() {

      const errorStub = sinon.stub(winston, 'error');
      const message = 'test123';

      logger.error(message);

      sinon.assert.calledOnce(errorStub);
      sinon.assert.calledWith(errorStub, message);

      errorStub.restore();

    });

  });

});