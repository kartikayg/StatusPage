/**
 * this test will behave more like an integeration test
 */

import {assert} from 'chai';
import sinon from 'sinon';
import request from 'supertest';

import amqp from 'amqp';
import isJSON from 'is-json';
import httpStatus from 'http-status';

import logger from './lib/logger';

describe('app - integration tests', function () {

  this.timeout(20000);

  let messagingQueue, createdGroupObjId;

  const appLogQueueCallbackSpy = sinon.spy();
  const reqLogQueueCallbackSpy = sinon.spy();

  before(function (done) {

    // create a logs exchange on the messaging queue
    messagingQueue = amqp.createConnection({url: process.env.RABBMITMQ_CONN_ENDPOINT});
    messagingQueue.on('ready', () => {

      // setup the exchange
      messagingQueue.exchange('logs', {durable: true, autoDelete: false,type: 'direct'}, () => {

        // setup app log queue to listen on the exchange
        messagingQueue.queue('applog', (q) => {
          q.bind('logs', 'app');
          q.subscribe((msg) => {
            appLogQueueCallbackSpy(msg.data.toString());
          });
        });

        messagingQueue.queue('reqlog', (q) => {
          q.bind('logs', 'request');
          q.subscribe((msg) => {
            reqLogQueueCallbackSpy(msg.data.toString());
          });
        });

      });

    });

    setTimeout(done, 2000);

  });

  after(function () {
    messagingQueue.disconnect();
  });

  describe ('logger', function () {

    let app;

    before(function (done) {
      require('./app').start().then(r => {
        app = r;
      });
      setTimeout(done, 2000);
    });

    after(function (done) {
      require('./app').stop();
      require('./lib/logger').resetToConsole();
      setTimeout(done, 2000);
    });

    beforeEach(function (done) {
      setTimeout(function () {
        appLogQueueCallbackSpy.reset();
        done();
      }, 500);
    });

    it ('should publish to queue when logging a message', function (done) {

      logger.log('debug', 'hello kartikay');

      setTimeout(function() {

        sinon.assert.calledOnce(appLogQueueCallbackSpy);
        const arg = appLogQueueCallbackSpy.args[0][0];

        assert.isTrue(isJSON(arg));

        const o = JSON.parse(arg);

        assert.strictEqual(o.level, 'debug');
        assert.strictEqual(o.message, 'hello kartikay');
        assert.strictEqual(o.meta.serviceName, process.env.SERVICE_NAME);
        assert.match(o.meta.timestamp, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/);

        done();

      }, 2000);

    });

    it ('should publish to queue when logging an error', function (done) {

      logger.log('error', new Error('this is an error'));

      setTimeout(function() {

        sinon.assert.calledOnce(appLogQueueCallbackSpy);
        const arg = appLogQueueCallbackSpy.args[0][0];

        assert.isTrue(isJSON(arg));

        const o = JSON.parse(arg);

        assert.strictEqual(o.level, 'error');
        assert.strictEqual(o.message, 'this is an error');
        assert.strictEqual(o.meta.serviceName, process.env.SERVICE_NAME);
        assert.match(o.meta.timestamp, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/);
        assert.strictEqual(o.meta.name, 'Error');
        assert.strictEqual(o.meta.code, 500);
        assert.isString(o.meta.stack);

        done();

      }, 2000);

    });

  });


  describe('component_groups endpoint', function () {

    let app;

    before(function (done) {
      require('./app').start().then(r => {
        app = r;
      });
      setTimeout(done, 2000);
    });

    after(function (done) {
      require('./app').stop();
      require('./lib/logger').resetToConsole();
      setTimeout(done, 2000);
    });

    beforeEach(function (done) {
      setTimeout(function () {
        reqLogQueueCallbackSpy.reset();
        appLogQueueCallbackSpy.reset();
        done();
      }, 500);
    });

    const componentGroupTestObj = {
      name: 'Widget API group test',
      status: 'operational',
      sort_order: 1
    };

    it ('should create and return a component group object', function (done) {

      request(app)
        .post('/api/component_groups')
        .send({ componentgroup: componentGroupTestObj })
        .expect('Content-Type', /json/)
        .expect(200)
        .then(res => {
          const c = res.body;

          assert.isObject(c);

          createdGroupObjId = c.id;

          assert.deepEqual(
            Object.keys(c).sort(),
            ['name', 'description', 'status', 'sort_order', 'active', 'id', 'created_at', 'updated_at'].sort()
          );

          done();

        });
    });

    it ('should fail b/c of no component group posted', function (done) {

      this.timeout(2500);

      request(app)
        .post('/api/component_groups')
        .expect('Content-Type', /json/)
        .expect(422, {message: 'No component group data sent in this request.'})
        .then(res => {
          done();
        });
    });

    it ('should partial update the component group', function (done) {

      const group = {
        status: 'partial_outage'
      };

      request(app)
        .patch(`/api/component_groups/${createdGroupObjId}`)
        .send({ componentgroup: group })
        .expect('Content-Type', /json/)
        .expect(200)
        .then(res => {
          done();
        });

    });


    it ('should return the component group by id with updated data', function (done) {

      request(app)
        .get(`/api/component_groups/${createdGroupObjId}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(res => {

          const c = res.body;

          assert.isObject(c);
          assert.strictEqual(c.id, createdGroupObjId);
          assert.strictEqual(c.status, 'partial_outage');

          done();
        });

    });

  });


  describe('components endpoint', function () {

    let app;

    before(function (done) {
      require('./app').start().then(r => {
        app = r;
      });
      setTimeout(done, 2000);
    });

    after(function (done) {
      require('./app').stop();
      require('./lib/logger').resetToConsole();
      setTimeout(done, 2000);
    });

    beforeEach(function (done) {
      setTimeout(() => {
        reqLogQueueCallbackSpy.reset();
        appLogQueueCallbackSpy.reset();
        done();
      }, 500);
    });

    const componentTestObj = {
      name: 'Widget API test',
      description: 'The API to access all of the widgets',
      status: 'operational',
      sort_order: 1
    };

    let createdObjId;

    it ('should create and return a component object', function (done) {

      this.timeout(2500);

      request(app)
        .post('/api/components')
        .send({ component: componentTestObj })
        .expect('Content-Type', /json/)
        .expect(200)
        .then(res => {
          const c = res.body;

          assert.isObject(c);

          createdObjId = c.id;

          assert.deepEqual(
            Object.keys(c).sort(),
            ['name', 'description', 'status', 'sort_order', 'active', 'id', 'created_at', 'updated_at', 'group_id'].sort()
          );

          // it should also be send a message to the queue for the request call
          setTimeout(() => {
            sinon.assert.calledOnce(reqLogQueueCallbackSpy);

            const arg = reqLogQueueCallbackSpy.args[0][0];
            assert.isTrue(isJSON(arg));

            const o = JSON.parse(arg);

            assert.strictEqual(o.method, 'POST');
            assert.strictEqual(o.url, '/api/components');
            assert.strictEqual(o.status, '200');
            assert.strictEqual(o.serviceName, process.env.SERVICE_NAME);

            assert.isString(o.responseTime);
            assert.isString(o.timestamp);

            done();

          }, 2000);

        });
    });

    it ('should fail b/c of no component posted', function (done) {

      this.timeout(2500);

      request(app)
        .post('/api/components')
        .expect('Content-Type', /json/)
        .expect(422, {message: 'No component data sent in this request.'})
        .then(res => {
          
          setTimeout(() => {
            // as its 422, it shouldn't be logging
            sinon.assert.notCalled(appLogQueueCallbackSpy);

            // but the request should be getting logged
            sinon.assert.calledOnce(reqLogQueueCallbackSpy);

            done();
          }, 2000);

        });
    });

    it ('should partial update the component', function (done) {

      const component = {
        status: 'partial_outage'
      };

      request(app)
        .patch(`/api/components/${createdObjId}`)
        .send({ component })
        .expect('Content-Type', /json/)
        .expect(200)
        .then(res => {
          done();
        });

    });


    it ('should return the component by id with updated data', function (done) {

      request(app)
        .get(`/api/components/${createdObjId}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(res => {

          const c = res.body;

          assert.isObject(c);
          assert.strictEqual(c.id, createdObjId);
          assert.strictEqual(c.status, 'partial_outage');

          done();
        });

    });

    it ('should create a component with group_id', function (done) {

       request(app)
        .post('/api/components')
        .send({ component: Object.assign({group_id: createdGroupObjId}, componentTestObj) })
        .expect('Content-Type', /json/)
        .expect(200)
        .then(res => {
          const c = res.body;

          assert.strictEqual(c.group_id, createdGroupObjId);

          done();
        });

    });

  });

});
