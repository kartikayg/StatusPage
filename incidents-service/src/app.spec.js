/**
 * These are integration tests and all the components are live (meaning no stubs).
 * There will be DB operations, messaging queue, etc. All the resources are started 
 * within docker container and will be handled by docker only.
 */

import {assert} from 'chai';
import sinon from 'sinon';
import request from 'supertest';
import MockDate from 'mockdate';

import moment from 'moment';

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
  const newIncidentUpdateQueueCallbackSpy = sinon.spy();

  let dbConnection;

  let app, agent;

  before(function (done) {

    MockDate.set(staticCurrentTime);

    MongoClient.connect(process.env.MONGO_ENDPOINT, (err, db) => {
      dbConnection = db;

      // as it runs the db in docker container, the db is never destroyed. so for each test run,
      // drop the table and re-create it.
      dbConnection.collection('incidents').drop().catch(e => {});

    });

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
          q.bind('incidents', 'new-update');
          q.subscribe((msg) => {
            newIncidentUpdateQueueCallbackSpy(msg.data.toString());
          });
        });

      });

    });


    setTimeout(() => {
      require('./app').start().then(r => {
        app = r;
        agent = request.agent(app);
      });
    }, 1000);

    setTimeout(done, 3000);

  });

  after(function (done) {
    dbConnection.close();
    MockDate.reset();
    messagingQueue.disconnect();
    require('./app').shutdown();
    require('./lib/logger').resetToConsole();

    setTimeout(done, 2000);

  });

  describe ('logger', function () {

    beforeEach(function (done) {
      setTimeout(() => {
        reqLogQueueCallbackSpy.reset();
        appLogQueueCallbackSpy.reset();
        newIncidentUpdateQueueCallbackSpy.reset();
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


  describe('endpoints', function () {

    let realtimeIncidentId;

    beforeEach(function (done) {
      setTimeout(() => {
        reqLogQueueCallbackSpy.reset();
        appLogQueueCallbackSpy.reset();
        newIncidentUpdateQueueCallbackSpy.reset();
        done();
      }, 500);
    });

    describe('type#realtime', function () {

      let incidentId;
      let incidentUpdateId;

      it ('should create a new realtime incident', function(done) {

        const newIncidentObj = {
          name: 'realtime api incident',
          components: ['CM123'],
          message: 'API is not working',
          status: 'investigating',
          type: 'realtime',
          do_notify_subscribers: true
        };

        agent
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
              name: 'realtime api incident',
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
                displayed_at: staticCurrentTime.toISOString()
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
              sinon.assert.calledOnce(newIncidentUpdateQueueCallbackSpy);

              done();

            }, 2000);

          });

      });

      it ('should add a new incident-update to the incident', function(done) {

        const incidentUpdate = {
          status: 'identified',
          message: 'the error has been identified'
        };

        agent
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
              sinon.assert.calledOnce(newIncidentUpdateQueueCallbackSpy);
              done();
            }, 2000);

          });

      });

      it ('should update the components but not add any new incident-update', function(done) {

        const incidentUpdate = {
          components: ['cid_1', 'cid_2']
        };

        agent
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
              // as we are not adding new update, this shouldn't be called.
              sinon.assert.notCalled(newIncidentUpdateQueueCallbackSpy);
              done();
            }, 2000);

          });

      });

      it ('should resolve the incident', function(done) {

        const incidentUpdate = {
          status: 'resolved',
          message: 'the issue is fixed'
        };

        agent
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
              sinon.assert.calledOnce(newIncidentUpdateQueueCallbackSpy);
              done();
            }, 2000);

          });

      });

      it ('should add a new incident-update with "update" status', function(done) {

        const incidentUpdate = {
          message: 'this is what happened'
        };

        agent
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
              sinon.assert.calledOnce(newIncidentUpdateQueueCallbackSpy);
              done();
            }, 2000);

          });

      });

      it ('should update incident-update', function(done) {

        const incidentUpdate = {
          message: 'message update',
          displayed_at: new Date()
        };

        agent
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
              sinon.assert.notCalled(newIncidentUpdateQueueCallbackSpy);

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

        agent
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
                displayed_at: staticCurrentTime.toISOString()
              }],
              is_resolved: true,
              resolved_at: staticCurrentTime.toISOString() 
            };

            assert.deepEqual(expectedObj, incidentObj);
            
            // lets check in db also
            dbConnection.collection('incidents').count({id: incidentId}, (err, cnt) => {
              assert.strictEqual(cnt, 1);
            });

            setTimeout(() => {
              sinon.assert.calledOnce(reqLogQueueCallbackSpy);
              
              // no event fired in this case
              sinon.assert.notCalled(newIncidentUpdateQueueCallbackSpy);

              done();

            }, 2000);

          });

      });

      it ('should load backfilled incident', function(done) {

        agent
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

    describe('type#scheduled', function () {

      let scheduledIncidentObj;

      it ('should create a scheduled incident', function (done) {

        const newPartialIncidentObj = {
          name: 'incident',
          components: ['component_id'],
          message: 'this is scheduled',
          type: 'scheduled',
          do_notify_subscribers: true,
          scheduled_start_time: moment().add(1, 'h').toDate(),
          scheduled_end_time: moment().add(2, 'h').toDate()
        };

        agent
          .post('/api/incidents')
          .send({ incident: newPartialIncidentObj })
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {
            scheduledIncidentObj = res.body;
            assert.isObject(scheduledIncidentObj);

            assert.strictEqual(scheduledIncidentObj.type, 'scheduled');

            setTimeout(() => {
              sinon.assert.calledOnce(reqLogQueueCallbackSpy);
              sinon.assert.calledOnce(newIncidentUpdateQueueCallbackSpy);
              done();
            }, 2000);

          });

      });

      it ('should update name and components on the incident', function (done) {

        const updateData = {
          name: 'scheduled-incident',
          components: ['cid_1', 'cid_2']
        };

        agent
          .patch(`/api/incidents/${scheduledIncidentObj.id}`)
          .send({ incident: updateData })
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {
            scheduledIncidentObj = res.body;

            assert.strictEqual(scheduledIncidentObj.name, updateData.name);
            assert.deepEqual(scheduledIncidentObj.components, updateData.components);

             setTimeout(() => {
              // not called in this case
              sinon.assert.notCalled(newIncidentUpdateQueueCallbackSpy);
              done();
            }, 2000);

          });
      });

      it ('should put the incident in in_progress', function (done) {

        const updateData = {
          status: 'in_progress',
          message: 'it is in progress now'
        };

        agent
          .patch(`/api/incidents/${scheduledIncidentObj.id}`)
          .send({ incident: updateData })
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {
            scheduledIncidentObj = res.body;

            assert.strictEqual(scheduledIncidentObj.scheduled_status, 'in_progress');

            assert.equal(scheduledIncidentObj.updates.length, 2);

            assert.equal(scheduledIncidentObj.updates[1].status, 'in_progress');
            assert.equal(scheduledIncidentObj.updates[1].message, updateData.message);

            done();

          });

      });

      it ('should fail to cancel the incident once in progress', function (done) {

        const updateData = {
          status: 'cancelled',
          message: 'cancelling'
        };

        agent
          .patch(`/api/incidents/${scheduledIncidentObj.id}`)
          .send({ incident: updateData })
          .expect('Content-Type', /json/)
          .expect(422)
          .then(res => {
            assert.equal(res.body.message, 'Status: cancelled is not allowed for this incident.');
            done();
          });

      });

      it ('should fail b/c of invalid end time being posted', function(done) {

        const updateData = {
          scheduled_end_time: moment(scheduledIncidentObj.scheduled_start_time).subtract(10, 'm').toISOString()
        };

        agent
          .patch(`/api/incidents/${scheduledIncidentObj.id}`)
          .send({ incident: updateData })
          .expect('Content-Type', /json/)
          .expect(422)
          .then(res => {
            assert.equal(res.body.message, 'End time must be after the start time');
            done();
          });

      });

      it ('should add the update with verifying status', function (done) {

        const updateData = {
          status: 'verifying',
          message: 'it is in progress now'
        };

        agent
          .patch(`/api/incidents/${scheduledIncidentObj.id}`)
          .send({ incident: updateData })
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {
            scheduledIncidentObj = res.body;

            assert.strictEqual(scheduledIncidentObj.scheduled_status, 'in_progress');

            assert.equal(scheduledIncidentObj.updates.length, 3);

            assert.equal(scheduledIncidentObj.updates[2].status, 'verifying');
            assert.equal(scheduledIncidentObj.updates[2].message, updateData.message);

            done();

          });

      });

      it ('should resolve the incident', function (done) {

        const updateData = {
          status: 'resolved',
          message: 'it is resolved now'
        };

        agent
          .patch(`/api/incidents/${scheduledIncidentObj.id}`)
          .send({ incident: updateData })
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {
            scheduledIncidentObj = res.body;

            assert.strictEqual(scheduledIncidentObj.scheduled_status, 'completed');

            assert.equal(scheduledIncidentObj.updates.length, 4);

            assert.equal(scheduledIncidentObj.updates[3].status, 'resolved');
            assert.equal(scheduledIncidentObj.updates[3].message, updateData.message);

            assert.equal(scheduledIncidentObj.is_resolved, true);
            assert.equal(scheduledIncidentObj.resolved_at, staticCurrentTime.toISOString());

            done();

          });

      });

      it ('should add a new incident-update with "update" status', function(done) {

        const incidentUpdate = {
          message: 'this is what happened'
        };

        agent
          .patch(`/api/incidents/${scheduledIncidentObj.id}`)
          .send({ incident: incidentUpdate })
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {

            scheduledIncidentObj = res.body;

            assert.strictEqual(scheduledIncidentObj.updates.length, 5);
            assert.strictEqual(scheduledIncidentObj['updates'][4].status, 'update');

            done();

          });

      });

    });

    describe('misc', function() {

      it ('should return all incidents', function(done) {

        agent
          .get(`/api/incidents`)
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {

            const incidents = res.body;

            assert.isArray(incidents);
            assert.strictEqual(incidents.length, 3);

            assert.strictEqual(incidents[0].type, 'realtime');
            assert.strictEqual(incidents[1].type, 'backfilled');

            // lets check in db also
            dbConnection.collection('incidents').count({}, (err, cnt) => {
              assert.strictEqual(cnt, 3);
              done();
            });

          });

      });

      it ('should return incidents with type realtime', function(done) {

        agent
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

        agent
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

        agent
          .delete(`/api/incidents/${realtimeIncidentId}`)
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {
            assert.deepEqual(res.body, { message: 'Incident deleted' });

            // lets check in db also
            dbConnection.collection('incidents').count({id: realtimeIncidentId}, (err, cnt) => {
              assert.strictEqual(cnt, 0);
              done();
            });

        });

      });

      it ('should return 200 on health check', function(done) {

        agent
          .get('/api/health-check')
          .expect('Content-Type', /json/)
          .expect(200, done);

      });

      it ('should return 404 on invalid url', function(done) {

        agent
          .get('/api/incidents/test/test')
          .expect('Content-Type', /json/)
          .expect(404, done);

      });

    });

  });

});
