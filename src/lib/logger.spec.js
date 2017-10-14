import {assert} from 'chai';
import sinon from 'sinon';
import winston from 'winston';
import 'winston-mongodb';

import * as logger from './logger';

describe('lib/logger', function() {

  describe('log methods', function() {

    let logStub;

    beforeEach(function() {
      logStub = sinon.stub(winston, 'log');
    });

    afterEach(function() {
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

    it('warn()', function() {

      const message = 'test123';

      logger.warn(message);

      sinon.assert.calledOnce(logStub);
      sinon.assert.calledWith(logStub, 'warn', message, {});

    });

     it('error()', function() {

      const message = 'test123';

      logger.error(message);

      sinon.assert.calledOnce(logStub);
      sinon.assert.calledWith(logStub, 'error', message, {});

    });

  });

});