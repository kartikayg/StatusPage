/**
 * These are integration tests and all the components are live (meaning no stubs).
 * There will be DB operations, messaging queue, etc. All the resources are started 
 * within docker container and will be handled by docker only.
 */

import {assert} from 'chai';
import sinon from 'sinon';
import request from 'supertest';
import MockDate from 'mockdate';

import amqp from 'amqp';
import isJSON from 'is-json';
import httpStatus from 'http-status';

import logger from './lib/logger';


describe('app - integration tests', function () {

  this.timeout(10000);

  const staticCurrentTime = new Date();

  let messagingQueue, componentGroupId;

  const appLogQueueCallbackSpy = sinon.spy();
  const reqLogQueueCallbackSpy = sinon.spy();

  let dbConnection;

  let app, agent;

  let jwtToken;

  before(function (done) {

    MockDate.set(staticCurrentTime);

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

    setTimeout(() => {
      require('./app').start()
        .then(r => {
          app = r;
          agent = request.agent(app);
        })
        .catch(e => {
          console.log(e);
        })
    }, 1000);

    setTimeout(done, 3000);

  });

  after(function (done) {
    MockDate.reset();
    messagingQueue.disconnect();
    require('./app').shutdown();
    require('./lib/logger').resetToConsole();
    setTimeout(done, 2000);

  });

  describe ('logger', function () {

    beforeEach(function (done) {
      setTimeout(function () {
        appLogQueueCallbackSpy.reset();
        done();
      }, 500);
    });

    it ('should publish to queue when logging a message', function (done) {

      logger.log('info', 'hello kartikay');

      setTimeout(function() {

        sinon.assert.calledOnce(appLogQueueCallbackSpy);
        const arg = appLogQueueCallbackSpy.args[0][0];

        assert.isTrue(isJSON(arg));

        const o = JSON.parse(arg);

        assert.strictEqual(o.level, 'info');
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

    it ('should not publish to queue if the log level is debug, as its above the max level', function (done) {

      logger.log('debug', 'hello kartikay');

      setTimeout(function() {
        sinon.assert.notCalled(appLogQueueCallbackSpy);
        done();
      }, 2000);

    });

  });

  describe ('authentication', function () {

    it ('should return error for invalid username/password', function(done) {

      agent
        .post('/api/v1/login_token')
        .send({ username: 'hello', password: 'wrong' })
        .expect('Content-Type', /json/)
        .expect(422, {message: 'Invalid username/password passed.'})
        .then(res => {
          done();
        });

    });

    it ('should generate a valid jwt token', function(done) {

      agent
        .post('/api/v1/login_token')
        .send({ username: 'admin', password: 'test123' })
        .expect('Content-Type', /json/)
        .expect(200)
        .then(res => {
          const { message, token } = res.body;

          assert.equal(message, 'Login successful');
          assert.isString(token);

          jwtToken = token;

          done();
        });

    });

  });

  describe ('components-service', function () {

    beforeEach(function (done) {
      setTimeout(() => {
        reqLogQueueCallbackSpy.reset();
        appLogQueueCallbackSpy.reset();
        done();
      }, 250);
    });

    it ('should get all components and groups', function(done) {

      agent
        .get('/api/v1/components')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(res => {
          const { components, componentGroups  } = res.body;
          assert.strictEqual(components.length, 1);
          assert.strictEqual(componentGroups.length, 1);
          
           // it should also be send a message to the queue for the request call.
          // putting a timeout b/c it takes some time for the request to go to the
          // messaging queue
          setTimeout(() => {

            sinon.assert.calledOnce(reqLogQueueCallbackSpy);

            const arg = reqLogQueueCallbackSpy.args[0][0];
            assert.isTrue(isJSON(arg));

            const o = JSON.parse(arg);

            assert.strictEqual(o.method, 'GET');
            assert.strictEqual(o.url, '/api/v1/components');
            assert.strictEqual(o.status, '200');
            assert.strictEqual(o.serviceName, process.env.SERVICE_NAME);

            assert.isString(o.responseTime);
            assert.isString(o.timestamp);

            done();

          }, 2000);

        });

    });

    it ('should fail authentication for creating component, missing token', function (done) {

      agent
        .post('/api/v1/components')
        .expect('Content-Type', /json/)
        .expect(401, done);

    });

    it ('should fail authentication, invalid token', function (done) {

      agent
        .post('/api/v1/components')
        .set('Authorization', 'Oauth 123334w2323232')
        .expect('Content-Type', /json/)
        .expect(401, done);

    });

    it ('should create a component', function (done) {

      agent
        .post('/api/v1/components')
        .set('Authorization', `JWT ${jwtToken}`)
        .send({ component: {} })
        .expect('Content-Type', /json/)
        .expect(200)
        .then(res => {
          const { component } = res.body;
          assert.isObject(component);
          assert.equal(component.id, 'CI-123');
          done();
        });

    });

    it ('should update a component', function (done) {

      agent
        .patch('/api/v1/components/123')
        .set('Authorization', `JWT ${jwtToken}`)
        .send({ component: {} })
        .expect('Content-Type', /json/)
        .expect(200)
        .then(res => {
          const { component } = res.body;
          assert.isObject(component);
          assert.equal(component.id, 'CI-123');
          done();
        });

    });


  });

  describe ('incidents-service', function () {

    it ('should get all incidents', function(done) {

      agent
        .get('/api/v1/incidents')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(res => {
          const incidents = res.body;
          assert.strictEqual(incidents.length, 1);
          done();
        });

    });

    it ('should fail authentication for creating incidents, missing token', function (done) {

      agent
        .post('/api/v1/incidents')
        .expect('Content-Type', /json/)
        .expect(401, done);

    });

    it ('should create an incident', function (done) {

      agent
        .post('/api/v1/incidents')
        .set('Authorization', `JWT ${jwtToken}`)
        .send({ incident: {} })
        .expect('Content-Type', /json/)
        .expect(200)
        .then(res => {
          const incident = res.body;
          assert.isObject(incident);
          assert.equal(incident.id, 'IC123');
          done();
        });

    });

    it ('should fail authentication for deleting incident, missing token', function (done) {

      agent
        .delete('/api/v1/incidents/ic123')
        .expect('Content-Type', /json/)
        .expect(401, done);

    });

    it ('should delete the incident', function (done) {

      agent
        .delete('/api/v1/incidents/IC123')
        .set('Authorization', `JWT ${jwtToken}`)
        .expect('Content-Type', /json/)
        .expect(200, done);

    });


  });

  describe ('misc', function () {

    it ('should return 404 on invalid url', function(done) {

      agent
        .get('/api/v1/test/test')
        .expect('Content-Type', /json/)
        .expect(404, done);

    });

    it ('should return 200 on health check', function(done) {

        agent
          .get('/api/v1/health-check')
          .expect('Content-Type', /json/)
          .expect(200, done);

      });

  });

});
