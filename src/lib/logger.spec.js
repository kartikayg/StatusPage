import {assert} from 'chai';
import sinon from 'sinon';
import winston from 'winston';
import {MongoDB as winstonmongodb} from 'winston-mongodb';

import logger from './logger';

describe('lib/logger', function() {
  
  var configureStub;
  var addStub;

  beforeEach(function() {
     configureStub = sinon.stub(winston, 'configure');
     addStub = sinon.stub(winston, 'add');
  });

  afterEach(function() {
    configureStub.restore();
    addStub.restore();
  });

  it('when logging is disabled', function() {

    logger.init({
       isEnabled: false,
       level: 'error'
    }, {});

    sinon.assert.calledOnce(configureStub);
    sinon.assert.alwaysCalledWith(configureStub, {transports: []});

    sinon.assert.notCalled(addStub);

  });

  it('should have the correct logging level', function() {

    logger.init({
       isEnabled: true,
       level: 'error'
    }, {});

    assert.strictEqual('error', winston.level);

  });

  it('should setup correct transporters when logging is enabled', function() {

    logger.init({
       isEnabled: true,
       level: 'warn'
    }, {});

    assert.strictEqual('warn', winston.level);

    sinon.assert.calledOnce(configureStub);
    sinon.assert.alwaysCalledWith(configureStub, {transports: []});

    sinon.assert.calledTwice(addStub);
    sinon.assert.calledWith(addStub, winston.transports.Console);
    sinon.assert.calledWith(addStub, winstonmongodb);

  });

});