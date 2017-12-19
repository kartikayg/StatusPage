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

  const amqpQueue = {
    bind: sinon.spy(),
    subscribe: sinon.spy()
  };

  class ConnectionMock extends EventEmitter {
    
    constructor(connOptions, options) {
      super();
      switch (connOptions.url) {
        case validEndpoint:
          setTimeout(() => { this.emit('ready'); }, 300);
          break;
        case endEndpoint:
          setTimeout(() => { this.emit('ready'); }, 200);
          setTimeout(() => { this.emit('error', new Error('error')); }, 300);
          setTimeout(() => { this.emit('end'); }, 500);
          break;
        default:
          setTimeout(() => { this.emit('error', new Error('error')); }, 500); 
          break;
      }
    }

    reconnect() {}

    queue(name, opts, callback) {
      callback(amqpQueue)
    }

  }

  let latestConnectionMockObj;

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
    delete require.cache[require.resolve('./logger/application')];
    delete require.cache[require.resolve('./messaging-queue')];

    // init variables
    initQueue = require('./messaging-queue').init;

    const logger = require('./logger/application').default;
    logErrorSpy = sinon.spy(logger, 'error');

  });

  // mockery done
  after(function () {
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

    it ('should log error if connection emits error', function (done) {

      this.timeout(2000);

      initQueue('invalid', 1500).catch(e => {
        sinon.assert.calledOnce(logErrorSpy);
        done();
      });

    });

    it ('should reject if no connection ready before the timeout', function (done) {

      initQueue('invalid', 500).catch(e => {
        assert.strictEqual(e.message, 'Not able to establish a connection with the server: invalid.');
        done();
      });

    });


    it ('should reconnects if the connection ends', function (done) {

      this.timeout(3000);

      initQueue(endEndpoint, 4000).then(queue => {
        
        const reconnectSpy = sinon.spy(latestConnectionMockObj, 'reconnect');

        setTimeout(() => {
          sinon.assert.calledOnce(reconnectSpy);
          reconnectSpy.reset();
          done();
        }, 2000);

      });

    });

  });

  describe ('queue/subscribe', function () {

    let queue;
    let connQueueSpy;

    before(function (done) {
      initQueue(validEndpoint, 500).then(q => {
        queue = q;
        connQueueSpy = sinon.spy(latestConnectionMockObj, 'queue');
        done();
      });
    });

    beforeEach(function () {
      amqpQueue.bind.reset();
      amqpQueue.subscribe.reset();
      connQueueSpy.reset();
    });

    it ('should return a promise when subscribing', function () {
        expect(queue.subscribe('queue')).to.be.a('promise');
    });

    it ('should call queue on connection object', function (done) {

      queue.subscribe('queue').then(() => {
        sinon.assert.calledOnce(connQueueSpy);
        sinon.assert.calledWith(connQueueSpy, 'queue', {durable: true, autoDelete: false});
        sinon.assert.notCalled(amqpQueue.bind);
        done();
      });

    });

    it ('should call queue on connection object with option params', function (done) {

      queue.subscribe('queue', {autoDelete: true, foo: 'bar'}).then(() => {          
        sinon.assert.calledOnce(connQueueSpy);
        sinon.assert.calledWith(connQueueSpy, 'queue', {durable: true, autoDelete: true, foo: 'bar'});
        done();
      });

    });

    it ('should bind on exchange on the queue', function (done) {

      queue.subscribe('queue', {exchangeName: 'logs', bindingKey: 'bind'}).then(() => {
        
        // omit out the exchange related params before calling queue
        sinon.assert.calledWith(connQueueSpy, 'queue', {durable: true, autoDelete: false});

        // bind exchange
        sinon.assert.calledOnce(amqpQueue.bind);
        sinon.assert.calledWith(amqpQueue.bind, 'logs', 'bind');

        done();
      });

    });

    it ('should bind on exchange on the queue with default binding key', function (done) {

      queue.subscribe('queue', {exchangeName: 'logs'}).then(() => {
        
        sinon.assert.calledWith(connQueueSpy, 'queue', {durable: true, autoDelete: false});

        // bind exchange
        sinon.assert.calledOnce(amqpQueue.bind);
        sinon.assert.calledWith(amqpQueue.bind, 'logs', '#');

        done();
      });

    });

    it ('should bind on exchange on the queue with default binding key', function (done) {

      queue.subscribe('queue', {exchangeName: 'logs'}).then(() => {

        // bind exchange
        sinon.assert.calledOnce(amqpQueue.bind);
        sinon.assert.calledWith(amqpQueue.bind, 'logs', '#');

        done();

      });

    });

    it ('should call calback when a json message comes', function (done) {

      const cb = sinon.spy();

      queue.subscribe('queue', {exchangeName: 'logs'}, cb).then(() => {

        sinon.assert.calledOnce(amqpQueue.subscribe);

        const f = amqpQueue.subscribe.args[0][0];

        const o = {a: 'test', b: 'value'};

        const msg = {
          data: {
            toString() { return JSON.stringify(o); }
          }
        };

        f(msg);

        sinon.assert.calledOnce(cb);
        sinon.assert.calledWith(cb, o);

        done();

      });

    });

    it ('should call calback when a non-json message comes', function (done) {

      const cb = sinon.spy();

      queue.subscribe('queue', {exchangeName: 'logs'}, cb).then(() => {

        sinon.assert.calledOnce(amqpQueue.subscribe);

        const f = amqpQueue.subscribe.args[0][0];

        const msg = {
          data: {
            toString() { return 'hello' }
          }
        };

        f(msg);

        sinon.assert.calledOnce(cb);
        sinon.assert.calledWith(cb, 'hello');

        done();

      });

    });

    it ('should not call calback when an empty message comes', function (done) {

      const cb = sinon.spy();

      queue.subscribe('queue', {exchangeName: 'logs'}, cb).then(() => {

        sinon.assert.calledOnce(amqpQueue.subscribe);

        const f = amqpQueue.subscribe.args[0][0];

        const msg = {
          data: {
            toString() { return null; }
          }
        };

        f(msg);

        sinon.assert.notCalled(cb);

        done();

      });

    });

  });


});

