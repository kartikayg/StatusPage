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
  const upsertIncidentQueueCallbackSpy = sinon.spy();

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

      // setup the exchange
      messagingQueue.exchange('incidents', {durable: true, autoDelete: false, type: 'direct'}, () => {

        // setup app log queue to listen on the exchange
        messagingQueue.queue('newincident', (q) => {
          q.bind('incidents', 'upsert');
          q.subscribe((msg) => {
            upsertIncidentQueueCallbackSpy(msg.data.toString());
          });
        });

      });

    });

    setTimeout(done, 2000);

  });

  after(function () {
    MockDate.reset();
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
      require('./app').shutdown();
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
        assert.strictEqual(o.meta.timestamp, staticCurrentTime.toISOString());
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

  describe('/incidents endpoint', function () {

    let app;

    before(function (done) {

      MongoClient.connect(process.env.MONGO_ENDPOINT, (err, db) => {
        db.collection('incidents').drop();
        db.close();
      });

      setTimeout(() => {
        require('./app').start().then(r => {
          app = r;
        });
      }, 1500);

      setTimeout(done, 5000);

    });

    after(function (done) {
      require('./app').shutdown();
      require('./lib/logger').resetToConsole();
      setTimeout(done, 2000);
    });

    beforeEach(function (done) {
      setTimeout(() => {
        reqLogQueueCallbackSpy.reset();
        appLogQueueCallbackSpy.reset();
        upsertIncidentQueueCallbackSpy.reset();
        done();
      }, 500);
    });

    let realtimeIncidentId;

    describe('type#realtime', function () {

      let incidentId;
      let incidentUpdateId;

      it ('should create a new realtime incident', function(done) {

        const newIncidentObj = {
          name: 'realtime incident',
          components: ['CM123'],
          message: 'API is not working',
          status: 'investigating',
          type: 'realtime',
          do_notify_subscribers: true
        };

        this.timeout(2500);

        request(app)
          .post('/api/incidents')
          .send({ incident: newIncidentObj })
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {

            const c = res.body;

            assert.isObject(c);

            incidentId = c.id;
            realtimeIncidentId = incidentId;
            incidentUpdateId = c.updates[0].id;

            const expectedObj = {
              name: 'realtime incident',
              type: 'realtime',
              components: [ 'CM123' ],
              id: incidentId,
              created_at: staticCurrentTime.toISOString(),
              updated_at: staticCurrentTime.toISOString(),
              updates:[{
                message: 'API is not working',
                status: 'investigating',
                do_notify_subscribers: true,
                id: incidentUpdateId,
                created_at: staticCurrentTime.toISOString(),
                updated_at: staticCurrentTime.toISOString(),
                displayed_at: staticCurrentTime.toISOString(),
                do_twitter_update: false 
              }],
              is_resolved: false,
              resolved_at: null 
            };

            assert.deepEqual(expectedObj, c);

            
            setTimeout(() => {
              
              // it should be send a message to the queue for the request call
              sinon.assert.calledOnce(reqLogQueueCallbackSpy);

              const arg = reqLogQueueCallbackSpy.args[0][0];
              assert.isTrue(isJSON(arg));

              const o = JSON.parse(arg);

              assert.strictEqual(o.method, 'POST');
              assert.strictEqual(o.url, '/api/incidents');
              assert.strictEqual(o.status, '200');
              assert.strictEqual(o.serviceName, process.env.SERVICE_NAME);
              assert.strictEqual(o.timestamp, staticCurrentTime.toISOString());
              assert.isString(o.responseTime);


              // it should be send a message to the queue for a new incident
              sinon.assert.calledOnce(upsertIncidentQueueCallbackSpy);

              done();

            }, 2000);

          });

      });

      it ('should add a new incident-update to the incident', function(done) {

        const incidentUpdate = {
          status: 'identified',
          message: 'the error has been identified'
        };

        this.timeout(2500);

        request(app)
          .patch(`/api/incidents/${incidentId}`)
          .send({ incident: incidentUpdate })
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {

            const incidentObj = res.body;

            assert.isObject(incidentObj);

            assert.strictEqual(incidentObj.updates.length, 2);

            assert.strictEqual(incidentObj['updates'][0].status, 'investigating');
            assert.strictEqual(incidentObj['updates'][1].status, 'identified');

            assert.strictEqual(incidentObj.is_resolved, false);
            
            setTimeout(() => {
              sinon.assert.calledOnce(reqLogQueueCallbackSpy);
              sinon.assert.calledOnce(upsertIncidentQueueCallbackSpy);

              done();

            }, 2000);

          });

      });

      it ('should update the components but not add any new incident-update', function(done) {

        const incidentUpdate = {
          components: ['cid_1', 'cid_2']
        };

        this.timeout(2500);

        request(app)
          .patch(`/api/incidents/${incidentId}`)
          .send({ incident: incidentUpdate })
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {

            const incidentObj = res.body;

            assert.isObject(incidentObj);

            assert.deepEqual(['cid_1', 'cid_2'], incidentObj.components)

            // still 2 ..
            assert.strictEqual(incidentObj.updates.length, 2);
            
            setTimeout(() => {
              sinon.assert.calledOnce(reqLogQueueCallbackSpy);
              sinon.assert.calledOnce(upsertIncidentQueueCallbackSpy);

              done();

            }, 2000);

          });

      });

      it ('should resolve the incident', function(done) {

        const incidentUpdate = {
          status: 'resolved',
          message: 'the issue is fixed'
        };

        this.timeout(2500);

        request(app)
          .patch(`/api/incidents/${incidentId}`)
          .send({ incident: incidentUpdate })
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {

            const incidentObj = res.body;

            assert.isObject(incidentObj);

            assert.strictEqual(incidentObj.updates.length, 3);

            assert.strictEqual(incidentObj['updates'][0].status, 'investigating');
            assert.strictEqual(incidentObj['updates'][1].status, 'identified');
            assert.strictEqual(incidentObj['updates'][2].status, 'resolved');

            assert.strictEqual(incidentObj.is_resolved, true);
            assert.strictEqual(incidentObj.resolved_at, staticCurrentTime.toISOString());
            
            setTimeout(() => {
              sinon.assert.calledOnce(reqLogQueueCallbackSpy);
              sinon.assert.calledOnce(upsertIncidentQueueCallbackSpy);
              done();
            }, 2000);

          });

      });

      it ('should add a new incident-update with "update" status', function(done) {

        const incidentUpdate = {
          message: 'this is what happened'
        };

        this.timeout(2500);

        request(app)
          .patch(`/api/incidents/${incidentId}`)
          .send({ incident: incidentUpdate })
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {

            const incidentObj = res.body;

            assert.isObject(incidentObj);

            assert.strictEqual(incidentObj.updates.length, 4);
            assert.strictEqual(incidentObj['updates'][3].status, 'update');
            
            setTimeout(() => {
              sinon.assert.calledOnce(reqLogQueueCallbackSpy);
              sinon.assert.calledOnce(upsertIncidentQueueCallbackSpy);
              done();
            }, 2000);

          });

      });

      it ('should update incident-update', function(done) {

        const incidentUpdate = {
          message: 'message update',
          displayed_at: new Date()
        };

        this.timeout(2500);

        request(app)
          .patch(`/api/incidents/${incidentId}/incident_updates/${incidentUpdateId}`)
          .send({ update: incidentUpdate })
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {

            const incidentObj = res.body;

            assert.isObject(incidentObj);

            assert.strictEqual(incidentObj['updates'][0].message, 'message update');
            assert.strictEqual(incidentObj['updates'][0].displayed_at, incidentUpdate.displayed_at.toISOString());
            
            setTimeout(() => {
              sinon.assert.calledOnce(reqLogQueueCallbackSpy);
              
              // no event fired in this case
              sinon.assert.notCalled(upsertIncidentQueueCallbackSpy);

              done();

            }, 2000);

        });

      });

    });

    describe('type#backfilled', function () {

      let incidentId;

      it ('should create a new backfilled incident', function(done) {

        const newIncidentObj = {
          name: 'backfilled incident',
          components: ['CM123'],
          message: 'API was not working',
          type: 'backfilled'
        };

        this.timeout(2500);

        request(app)
          .post('/api/incidents')
          .send({ incident: newIncidentObj })
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {

            const incidentObj = res.body;

            assert.isObject(incidentObj);

            incidentId = incidentObj.id;

            const expectedObj = {
              name: 'backfilled incident',
              type: 'backfilled',
              components: [ 'CM123' ],
              id: incidentId,
              created_at: staticCurrentTime.toISOString(),
              updated_at: staticCurrentTime.toISOString(),
              updates:[{
                message: 'API was not working',
                status: 'resolved',
                do_notify_subscribers: false,
                id: incidentObj.updates[0].id,
                created_at: staticCurrentTime.toISOString(),
                updated_at: staticCurrentTime.toISOString(),
                displayed_at: staticCurrentTime.toISOString(),
                do_twitter_update: false 
              }],
              is_resolved: true,
              resolved_at: staticCurrentTime.toISOString() 
            };

            assert.deepEqual(expectedObj, incidentObj);
            
            setTimeout(() => {
              
              // it should be send a message to the queue for the request call
              sinon.assert.calledOnce(reqLogQueueCallbackSpy);

              // it should be send a message to the queue for a new incident
              sinon.assert.calledOnce(upsertIncidentQueueCallbackSpy);

              done();

            }, 2000);

          });

      });

      it ('should load backfilled incident', function(done) {

        request(app)
          .get(`/api/incidents/${incidentId}`)
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {

            const incidentObj = res.body;

            assert.isObject(incidentObj);
            assert.strictEqual(incidentId, incidentObj.id);
            assert.strictEqual('backfilled', incidentObj.type);

            done();

          });

      });

    });

    describe('misc', function() {

      it ('should return all incidents', function(done) {

        request(app)
          .get(`/api/incidents`)
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {

            const incidents = res.body;

            assert.isArray(incidents);
            assert.strictEqual(incidents.length, 2);

            assert.strictEqual(incidents[0].type, 'realtime');
            assert.strictEqual(incidents[1].type, 'backfilled');

            done();

          });

      });

      it ('should return incidents with type realtime', function(done) {

        request(app)
          .get(`/api/incidents?type=realtime`)
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {

            const incidents = res.body;

            assert.isArray(incidents);
            assert.strictEqual(incidents.length, 1);

            assert.strictEqual(incidents[0].type, 'realtime');

            done();

          });

      });

      it ('should return incidents based on query search', function(done) {

        request(app)
          .get(`/api/incidents?query=api`)
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {

            const incidents = res.body;

            assert.isArray(incidents);
            assert.strictEqual(incidents.length, 2);

            done();

          });

      });

      it ('should delete an incident', function(done) {

        request(app)
          .delete(`/api/incidents/${realtimeIncidentId}`)
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {
            assert.deepEqual(res.body, { message: 'Incident deleted' });
            done();
        });

      });

    });

  });

  describe ('misc', function () {

    let app;

    before(function (done) {
      require('./app').start().then(r => {
        app = r;
      });
      setTimeout(done, 2000);
    });

    after(function (done) {
      require('./app').shutdown();
      require('./lib/logger').resetToConsole();
      setTimeout(done, 2000);
    });

    it ('should return 404 on invalid url', function(done) {

      request(app)
        .get('/api/incidents/test/test')
        .expect('Content-Type', /json/)
        .expect(404, done);

    });

  });

});
