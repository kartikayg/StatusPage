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
import MongoClient from 'mongodb';

import logger from './lib/logger';


describe('app - integration tests', function () {

  this.timeout(10000);

  const staticCurrentTime = new Date();

  let messagingQueue, componentGroupId;

  const appLogQueueCallbackSpy = sinon.spy();
  const reqLogQueueCallbackSpy = sinon.spy();

  let dbConnection;

  before(function (done) {

    MockDate.set(staticCurrentTime);

    MongoClient.connect(process.env.MONGO_ENDPOINT, (err, db) => {
      dbConnection = db;
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

    });

    setTimeout(done, 2000);

  });

  after(function () {
    dbConnection.close();
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


  describe('component_groups endpoint', function () {

    let app;

    before(function (done) {
      
      // as it runs the db in docker container, the db is never destroyed. so for each test run,
      // drop the table and re-create it.
      dbConnection.collection('component_groups').drop();

      setTimeout(() => {
        require('./app').start().then(r => {
          app = r;
        });
      }, 500);

      setTimeout(done, 2000);
    });

    after(function (done) {
      require('./app').shutdown();
      // this is important for other test cases outside of this file.
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

    const newComponentGroupTestObj = {
      name: 'Widget API group test',
      status: 'operational',
      sort_order: 1
    };

    it ('should create and return a component group object', function (done) {

      request(app)
        .post('/api/component_groups')
        .send({ componentgroup: newComponentGroupTestObj })
        .expect('Content-Type', /json/)
        .expect(200)
        .then(res => {
          
          const c = res.body;

          componentGroupId = c.id;

          const expectedObj = Object.assign({}, newComponentGroupTestObj, {
            id: componentGroupId,
            created_at: staticCurrentTime.toISOString(),
            updated_at: staticCurrentTime.toISOString(),
            description: null,
            active: true
          });

          assert.deepEqual(expectedObj, c);

          // lets check in db also
          dbConnection.collection('component_groups').find({id : componentGroupId}).toArray((err, dbRes) => {
            const cg = dbRes[0];
            const dbExpectedObj = Object.assign({}, expectedObj, {
              _id: cg._id,
              created_at: staticCurrentTime,
              updated_at: staticCurrentTime
            });

            assert.deepEqual(dbExpectedObj, cg);
            done();

          });

        });

    });

    it ('should fail b/c of no component group posted', function (done) {

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
        .patch(`/api/component_groups/${componentGroupId}`)
        .send({ componentgroup: group })
        .expect('Content-Type', /json/)
        .expect(200, done);

    });

    it ('should return the component group by id with updated data', function (done) {

      request(app)
        .get(`/api/component_groups/${componentGroupId}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(res => {

          const c = res.body;

          assert.isObject(c);
          assert.strictEqual(c.id, componentGroupId);
          assert.strictEqual(c.status, 'partial_outage');
          done();

        });

    });

    it ('should return all component groups created', function (done) {

      request(app)
          .get(`/api/component_groups`)
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {
            const groups = res.body;
            assert.isArray(groups);
            assert.strictEqual(groups.length, 1);

            // lets check in db also
            dbConnection.collection('component_groups').count({}, (err, cnt) => {
              assert.strictEqual(cnt, 1);
              done();
            });
          });

    });

  });


  describe('components endpoint', function () {

    let app;

    before(function (done) {

      // as it runs the db in docker container, the db is never destroyed. so for each test run,
      // drop the table and re-create it.
      dbConnection.collection('components').drop();

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
      setTimeout(() => {
        reqLogQueueCallbackSpy.reset();
        appLogQueueCallbackSpy.reset();
        done();
      }, 500);
    });

    const newComponentTestObj = {
      name: 'Widget API test',
      description: 'The API to access all of the widgets',
      status: 'operational',
      sort_order: 1
    };

    let componentObjId;

    it ('should create and return a component object', function (done) {

      request(app)
        .post('/api/components')
        .send({ component: newComponentTestObj })
        .expect('Content-Type', /json/)
        .expect(200)
        .then(res => {
          
          const c = res.body;

          componentObjId = c.id;

          const expectedObj = Object.assign({}, newComponentTestObj, {
            id: componentObjId,
            created_at: staticCurrentTime.toISOString(),
            updated_at: staticCurrentTime.toISOString(),
            group_id: null,
            active: true
          });

          assert.deepEqual(expectedObj, c);


          // it should also be send a message to the queue for the request call.
          // putting a timeout b/c it takes some time for the request to go to the
          // messaging queue
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
        .patch(`/api/components/${componentObjId}`)
        .send({ component })
        .expect('Content-Type', /json/)
        .expect(200, done);

    });

    it ('should return the component by id with updated data', function (done) {

      request(app)
        .get(`/api/components/${componentObjId}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(res => {
          const c = res.body;
          assert.isObject(c);
          assert.strictEqual(c.id, componentObjId);
          assert.strictEqual(c.status, 'partial_outage');
          done();
        });

    });

    it ('should create a component with group_id', function (done) {

       request(app)
        .post('/api/components')
        .send({ component: Object.assign({ group_id: componentGroupId }, newComponentTestObj) })
        .expect('Content-Type', /json/)
        .expect(200)
        .then(res => {
          const c = res.body;

          assert.strictEqual(c.group_id, componentGroupId);

          // lets check in db also
          dbConnection.collection('components').find({ id : c.id }).toArray((err, dbRes) => {
            const cmp = dbRes[0];
            const dbExpectedObj = Object.assign({}, newComponentTestObj, {
              _id: cmp._id,
              created_at: staticCurrentTime,
              updated_at: staticCurrentTime,
              id: c.id,
              group_id: componentGroupId,
              active: true
            });

            assert.deepEqual(dbExpectedObj, cmp);
            done();

          });

        });

    });

    it ('should return all components created', function (done) {

      request(app)
          .get(`/api/components`)
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {
            const components = res.body;
            assert.isArray(components);
            assert.strictEqual(components.length, 2);

            // lets check in db also
            dbConnection.collection('components').count({}, (err, cnt) => {
              assert.strictEqual(cnt, 2);
              done();
            });
          });

    });

    it ('should return only 1 component, with status filter ', function (done) {

      request(app)
          .get(`/api/components?status=partial_outage`)
          .expect('Content-Type', /json/)
          .expect(200)
          .then(res => {
            const components = res.body;
            assert.strictEqual(components.length, 1);
            assert.strictEqual(components[0].status, 'partial_outage');
            done();
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
        .get('/api/components/test/test')
        .expect('Content-Type', /json/)
        .expect(404, done);

    });

  });

});
