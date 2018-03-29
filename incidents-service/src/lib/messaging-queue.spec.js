/**
 * Testing to see if we are sending the right parameters on to the queue.
 *
 * Note: There is no actual messaging queue operations happening as we have stubbed
 * the queue.
 */

import {assert, expect} from 'chai';
import sinon from 'sinon';
import mockery from 'mockery';

import { EventEmitter } from 'events';

describe ('lib/messaging-queue', function () {

  const validEndpoint = 'rabbitmq://url';
  const endEndpoint = 'rabbitmq:://url/end';


  const amqpQueueStub = {
    bind: sinon.spy(),
    subscribe: sinon.spy()
  };

  const amqpExchangeStub = {
    publish: sinon.spy()
  };

  class ConnectionMock extends EventEmitter {
    
    constructor(connOptions, options) {
      super();
      switch (connOptions.url) {
        case validEndpoint:
          setTimeout(() => { this.emit('ready'); }, 300);
          break;
        case endEndpoint:
          setTimeout(() => { this.emit('ready'); }, 300);
          setTimeout(() => { this.emit('end'); }, 500);
          break;
        default:
          setTimeout(() => { this.emit('error', new Error('error')); }, 500); 
          break;
      }
      this.socket = {
        on(event, cb) {}
      };
    }

    queue(name, opts, callback) {
      callback(amqpQueueStub)
    }

    exchange(name, opts, callback) {
      callback(amqpExchangeStub)
    }

  }

  let latestConnectionMockObj;

  // 
  const amqpMock = {
    createConnection: function (connOptions, options) {
      latestConnectionMockObj = new ConnectionMock(connOptions, options);
      return latestConnectionMockObj;
    }
  };

  const createConnectionSpy = sinon.spy(amqpMock, 'createConnection');

  let initQueue;
  let logErrorSpy;

  // on before, setup mockery
  before(function () {

    // setup mockery
    mockery.enable({ warnOnUnregistered: false });
    mockery.registerMock('amqp', amqpMock);

    // loading module here so that the mockery is all setup. if loading before,
    // then mocking amqp won't work.
    delete require.cache[require.resolve('./logger')];
    delete require.cache[require.resolve('./messaging-queue')];

    // init variables
    initQueue = require('./messaging-queue').init;

    const logger = require('./logger').default;
    logErrorSpy = sinon.spy(logger, 'error');

  });

  // mockery done
  after(function () {
    mockery.deregisterMock('amqp');
    mockery.disable();
    delete require.cache[require.resolve('./messaging-queue')];
  });

  describe('initiating queue', function () {

    beforeEach(function () {
      createConnectionSpy.reset();
      logErrorSpy.reset();
    });

    
    it ('should return a promise when initiating connection', function () {
      expect(initQueue(validEndpoint, 1).catch(e => {})).to.be.a('promise');
    });

    it ('should return a queue when connection is ready', function (done) {

      initQueue(validEndpoint, 500).then(queue => {
        assert.isObject(queue);
        sinon.assert.calledOnce(createConnectionSpy);
        sinon.assert.calledWith(createConnectionSpy, {url: validEndpoint});
        done();
      });

    });

    it ('should reject if no connection ready before the timeout', function (done) {

      initQueue('invalid', 500).catch(e => {
        assert.strictEqual(e.message, 'Not able to establish a connection with the server: invalid.');
        done();
      });

    });

    it ('should timeout for invalid connection in the provided time', function (done) {

      this.timeout(5000);

      const startTime = (new Date()).getTime(); 

      initQueue('invalid', 3000).catch(e => {
        const seconds = Math.abs(((new Date()).getTime() - startTime) / 1000);
        assert.isTrue(seconds > 3 && seconds < 3.1);
        done();
      });

    });

  });

  describe ('queue/publish', function () {

    let messagingQueue;
    let connExchangeSpy;

    before(function (done) {
      initQueue(validEndpoint, 500).then(q => {
        messagingQueue = q;
        connExchangeSpy = sinon.spy(latestConnectionMockObj, 'exchange');
        done();
      });
    });

    beforeEach(function () {
      amqpExchangeStub.publish.reset();
      connExchangeSpy.reset();
    });

    it ('should return a promise when publishing', function () {
        expect(messagingQueue.publish('test', 'ex', {})).to.be.a('promise');
    });

    it ('should call exchange() on connection object when publishing with default params', function (done) {

      messagingQueue.publish('test', 'ex', {}).then(() => {
        sinon.assert.calledOnce(connExchangeSpy);
        sinon.assert.calledWith(connExchangeSpy, 'ex', {durable: true, autoDelete: false, type: 'direct'});
        done();
      });

    });

    it ('should call exchange() on connection object with option params', function (done) {

      messagingQueue.publish('test', 'ex', {autoDelete: true}).then(() => {
        sinon.assert.calledOnce(connExchangeSpy);
        sinon.assert.calledWith(connExchangeSpy, 'ex', {durable: true, autoDelete: true, type: 'direct'});
        done();
      });

    });

    it ('should call publish() on exchange object with the message', function (done) {

      messagingQueue.publish('test', 'ex', {routingKey: 'r'}).then(() => {
        sinon.assert.calledOnce(amqpExchangeStub.publish);
        sinon.assert.calledWith(amqpExchangeStub.publish, 'r', 'test');
        done();
      });

    });

     it ('should json stringify message if not string on publish()', function (done) {

      const message = {a: 'bcd'};

      messagingQueue.publish(message, 'ex', {routingKey: 'r'}).then(() => {
        sinon.assert.calledOnce(amqpExchangeStub.publish);
        sinon.assert.calledWith(amqpExchangeStub.publish, 'r', JSON.stringify(message));
        done();
      });

    });

  });


});

