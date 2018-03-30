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

import MongoClient from 'mongodb';

describe('app - integration tests', function () {

  this.timeout(20000);

  const staticCurrentTime = new Date();

  let messagingQueue;

  const appLogQueueCallbackSpy = sinon.spy();
  const reqLogQueueCallbackSpy = sinon.spy();

  let dbConnection;

  let app, agent;

  before(function (done) {

    MockDate.set(staticCurrentTime);

    MongoClient.connect(process.env.MONGO_ENDPOINT, (err, db) => {
      dbConnection = db;
      // as it runs the db in docker container, the db is never destroyed. so for each test run,
      // drop the table and re-create it.
      dbConnection.collection('subscriptions').drop().catch(e => {});
    });

    messagingQueue = amqp.createConnection({url: process.env.RABBMITMQ_CONN_ENDPOINT});
    messagingQueue.on('ready', () => {

      // create a logs exchange on the messaging queue
      // we will listen on the exchange to make sure the logger is pushing the message
      // on the queue
      messagingQueue.exchange('logs', {durable: true, autoDelete: false,type: 'direct'}, () => {

        // setup queue to listen on the exchange
        // two queues: 

        // 1). lib/logger messages
        messagingQueue.queue('applog', (q) => {
          q.bind('logs', 'app');
          q.subscribe((msg) => {
            appLogQueueCallbackSpy(msg.data.toString());
          });
        });

        // 2). request log messages
        messagingQueue.queue('reqlog', (q) => {
          q.bind('logs', 'request');
          q.subscribe((msg) => {
            reqLogQueueCallbackSpy(msg.data.toString());
          });
        });

      });

    });

    setTimeout(() => {
      require('./app').start().then(r => {
        app = r;
        agent = request.agent(app);
      });
    }, 2500);

    setTimeout(done, 4000);

  });

  after(function (done) {
    dbConnection.close();
    MockDate.reset();
    messagingQueue.disconnect();
    require('./app').shutdown();
    require('./lib/logger').resetToConsole();
    setTimeout(done, 1000);
  });

  describe ('lib/logger', function () {

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

        assert.deepEqual(o, {
          level: 'info',
          message: 'hello kartikay',
          meta: {
            serviceName: process.env.SERVICE_NAME,
            timestamp: staticCurrentTime.toISOString()
          }
        });

        done();

      }, 1000);

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
        assert.strictEqual(o.meta.timestamp, staticCurrentTime.toISOString());
        assert.strictEqual(o.meta.name, 'Error');
        assert.strictEqual(o.meta.code, 500);
        assert.isString(o.meta.stack);

        done();

      }, 1000);

    });

    it ('should not publish to queue if the log level is debug, as its above the max level', function (done) {

      logger.log('debug', 'hello kartikay');

      setTimeout(function() {
        sinon.assert.notCalled(appLogQueueCallbackSpy);
        done();
      }, 1000);

    });

  });

  describe('/subscriptions endpoint', function () {

    beforeEach(function (done) {
      setTimeout(() => {
        reqLogQueueCallbackSpy.reset();
        appLogQueueCallbackSpy.reset();
        done();
      }, 500);
    });

    let emailSubscriptionId;
    let webhookSubscriptionId;

    describe('type#email', function () {

      it ('should create a new subscription', function(done) {

        const newSubscriptionObj = {
          type: 'email',
          email: 'test@gmail.com',
          components: ['cid_1']
        };

        // make a call to create a subscription

        agent
          .post('/notification-service/api/subscriptions')
          .send({ subscription: newSubscriptionObj })
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {

            // the response should be a subscription object

            const subObj = res.body;

            emailSubscriptionId = subObj.id;

            const expectedObj = Object.assign({}, newSubscriptionObj, {
              id: emailSubscriptionId,
              created_at: staticCurrentTime.toISOString(),
              updated_at: staticCurrentTime.toISOString(),
              is_confirmed: false
            });

            assert.deepEqual(expectedObj, subObj);

            // test whether a request was logged for this call or not.
            // the request is logged by sending to the queue
            setTimeout(() => {
              
              // it should be send a message to the queue for the request call
              sinon.assert.calledOnce(reqLogQueueCallbackSpy);

              const arg = reqLogQueueCallbackSpy.args[0][0];

              assert.isTrue(isJSON(arg));

              const o = JSON.parse(arg);

              assert.strictEqual(o.method, 'POST');
              assert.strictEqual(o.url, '/notification-service/api/subscriptions');
              assert.strictEqual(o.status, '200');
              assert.strictEqual(o.serviceName, process.env.SERVICE_NAME);
              assert.strictEqual(o.timestamp, staticCurrentTime.toISOString());
              assert.isString(o.responseTime);

              done();

            }, 2000);

          });

      });

      it ('should create another email subscription', function (done) {

        // it has no specific components
        const newSubscriptionObj = {
          type: 'email',
          email: 'test2@gmail.com'
        };

        agent
          .post('/notification-service/api/subscriptions')
          .send({ subscription: newSubscriptionObj })
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {

            // lets check in db also
            dbConnection.collection('subscriptions').find({id : res.body.id}).toArray((err, dbRes) => {

              const s = dbRes[0];

              const expectedObj = Object.assign({}, newSubscriptionObj, {
                _id: s._id, 
                id: res.body.id,
                created_at: staticCurrentTime,
                updated_at: staticCurrentTime,
                is_confirmed: false,
                components: []
              });

              assert.deepEqual(expectedObj, s);

              done();

            });

          });

      });

      it ('should not fail for duplicated email address, return the already created one', function (done) {

        const newSubscriptionObj = {
          type: 'email',
          email: 'test2@gmail.com',
          components: ['cid_1', 'cid_2']
        };

        agent
          .post('/notification-service/api/subscriptions')
          .send({ subscription: newSubscriptionObj })
          .expect('Content-Type', /json/)
          .expect(200, done);

      });

      it ('should confirm an email subscription', function (done) {

        agent
          .patch(`/notification-service/api/subscriptions/${emailSubscriptionId}/confirm`)
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {
            assert.strictEqual(res.body.is_confirmed, true);
            done();
          });

      });
      
      it ('should return the email subscription based on id', function (done) {

        const expected =  {
          id: emailSubscriptionId,
          type: 'email',
          email: 'test@gmail.com',
          components: ['cid_1'],
          created_at: staticCurrentTime.toISOString(),
          updated_at: staticCurrentTime.toISOString(),
          is_confirmed: true // it got confirmed in the prev test case
        };

        agent
          .get(`/notification-service/api/subscriptions/${emailSubscriptionId}`)
          .expect('Content-Type', /json/)
          .expect(200, expected, done);

      });

      it ('should return 422 for an invalid subscription id', function (done) {

        agent
          .get(`/notification-service/api/subscriptions/123`)
          .expect('Content-Type', /json/)
          .expect(422, done);

      });

    });

    describe('type#webhook', function () {

      it ('should create a new subscription', function(done) {

        const newSubscriptionObj = {
          type: 'webhook',
          uri: 'http://ktechstatus.com/endpoint',
          components: ['cid_1']
        };

        // make a call to create a subscription

        agent
          .post('/notification-service/api/subscriptions')
          .send({ subscription: newSubscriptionObj })
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {

            // the response should be a subscription object

            const subObj = res.body;

            webhookSubscriptionId = subObj.id;

            const expectedObj = Object.assign({}, newSubscriptionObj, {
              id: webhookSubscriptionId,
              created_at: staticCurrentTime.toISOString(),
              updated_at: staticCurrentTime.toISOString(),
              is_confirmed: true
            });

            assert.deepEqual(expectedObj, subObj);

            // test whether a request was logged for this call or not.
            // the request is logged by sending to the queue
            setTimeout(() => {
              
              // it should be send a message to the queue for the request call
              sinon.assert.calledOnce(reqLogQueueCallbackSpy);

              const arg = reqLogQueueCallbackSpy.args[0][0];

              assert.isTrue(isJSON(arg));

              const o = JSON.parse(arg);

              assert.strictEqual(o.method, 'POST');
              assert.strictEqual(o.url, '/notification-service/api/subscriptions');
              assert.strictEqual(o.status, '200');
              assert.strictEqual(o.serviceName, process.env.SERVICE_NAME);
              assert.strictEqual(o.timestamp, staticCurrentTime.toISOString());
              assert.isString(o.responseTime);

              done();

            }, 2000);

          });

      });

      it ('should create another webhook subscription', function (done) {

        const newSubscriptionObj = {
          type: 'webhook',
          uri: 'http://ktechstatus.com/endpoint2',
          components: ['cid_1']
        };

        // make a call to create a subscription

        agent
          .post('/notification-service/api/subscriptions')
          .send({ subscription: newSubscriptionObj })
          .expect('Content-Type', /json/)
          .expect(200, done);

      });

      it ('should not fail for duplicated endpoint, return the existing one', function (done) {

        const newSubscriptionObj = {
          type: 'webhook',
          uri: 'http://ktechstatus.com/endpoint2',
          components: ['cid_1']
        };

        agent
          .post('/notification-service/api/subscriptions')
          .send({ subscription: newSubscriptionObj })
          .expect('Content-Type', /json/)
          .expect(200, done);

      });

      it ('should update components', function (done) {

        agent
          .patch(`/notification-service/api/subscriptions/${webhookSubscriptionId}/manage_components`)
          .send({ components: ['cid_1', 'cid_2'] })
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {
            assert.deepEqual(res.body.components, ['cid_1', 'cid_2']);
            done();
          });

      });

    });

    describe ('misc', function () {

      it ('should return all subscriptions', function(done) {
        agent
          .get(`/notification-service/api/subscriptions`)
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {
            const subscriptions = res.body;
            assert.isArray(subscriptions);
            assert.strictEqual(subscriptions.length, 4);

            // lets check in db also
            dbConnection.collection('subscriptions').count({}, (err, cnt) => {
              assert.strictEqual(cnt, 4);
              done();
            });
          });

      });

      it ('should return subscriptions with filter type=webhook', function(done) {
        agent
          .get(`/notification-service/api/subscriptions?type=webhook`)
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {
            const subscriptions = res.body;
            assert.isArray(subscriptions);
            assert.strictEqual(subscriptions.length, 2);

            assert.strictEqual(subscriptions[0].type, 'webhook');
            assert.strictEqual(subscriptions[1].type, 'webhook');

            done();
          });

      });

      it ('should return subscriptions with filter type=email,is_confirmed=true', function(done) {
        agent
          .get(`/notification-service/api/subscriptions?type=email&is_confirmed=true`)
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {
            const subscriptions = res.body;
            assert.isArray(subscriptions);
            assert.strictEqual(subscriptions.length, 1);

            assert.strictEqual(subscriptions[0].type, 'email');
            assert.strictEqual(subscriptions[0].is_confirmed, true);

            done();
          });

      });

      it ('should return subscriptions with filter component=cid_2', function(done) {

        agent
          .get(`/notification-service/api/subscriptions?components=cid_2`)
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {
            const subscriptions = res.body;
            assert.isArray(subscriptions);
              
            // should return 2 ..
            // first is email subscription with no specific components
            // second is webhook with 2 components (cid_1 and cid_2)
            assert.strictEqual(subscriptions.length, 2);

            assert.strictEqual(subscriptions[0].type, 'email');
            assert.deepEqual(subscriptions[0].components, []);

            assert.strictEqual(subscriptions[1].type, 'webhook');
            assert.deepEqual(subscriptions[1].components, ['cid_1', 'cid_2']);

            done();

          });

      });

      it ('should delete a subscription', function(done) {

        agent
          .delete(`/notification-service/api/subscriptions/${emailSubscriptionId}`)
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {
            assert.deepEqual(res.body, { message: 'Subscription removed' });

             // lets check in db also
            dbConnection.collection('subscriptions').count({id: emailSubscriptionId}, (err, cnt) => {
              assert.strictEqual(cnt, 0);
              done();
            });

          });

      });

    });

  });

  

  describe ('misc', function () {

    it ('should return 200 on health check', function(done) {

      agent
        .get('/notification-service/api/health-check')
        .expect('Content-Type', /json/)
        .expect(200, done);

    });
    
    it ('should return 404 on invalid url', function(done) {

      agent
        .get('/notification-service/api/subscriptions/test/test')
        .expect('Content-Type', /json/)
        .expect(404, done);

    });

  });

});
