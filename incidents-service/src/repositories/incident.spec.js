import {assert} from 'chai';
import sinon from 'sinon';
import MockDate from 'mockdate';

import pick from 'lodash/fp/pick';
import omit from 'lodash/fp/omit';
import find from 'lodash/fp/find';
import cloneDeep from 'lodash/fp/cloneDeep';

import incidentRepo from './incident';
import {incident as incidentEntity, incidentUpdate as incidentUpdateEntity } from '../entities/index';

describe('repo/incident', function() {

  /**
   * MOCK VARIABLES
   */

   // stub for the messaging queue
  const messagingQueueMockObj = {
    publish: sinon.spy()
  };

  const staticCurrentTime = new Date();

  const testBackfilledIncidentId = 'IC123';
  
  const testRealtimeIncidentId = 'IC456';
  const testPendingRealtimeIncidentId = 'IC097';

  const testIncUpdateId = 'IU123';

  const newPartialIncidentObj = {
    name: 'incident',
    components: ['component_id'],
    message: 'message',
    do_twitter_update: true,
    is_resolved: false,
    do_notify_subscribers: true
  };

  const existingBackfilledIncident = {
    id: testBackfilledIncidentId,
    _id: '_id',
    name: 'incident',
    components: ['component_id'],
    is_resolved: true,
    created_at: staticCurrentTime,
    updated_at: staticCurrentTime,
    resolved_at: staticCurrentTime,
    type: 'backfilled',
    updates: [{
      id: testIncUpdateId,
      _id: '_id',
      created_at: staticCurrentTime,
      updated_at: staticCurrentTime,
      do_twitter_update: true,
      do_notify_subscribers: false,
      status: 'resolved',
      message: 'message'
    }]
  };

  const existingRealtimeIncident = {
    id: testRealtimeIncidentId,
    _id: '_id',
    name: 'incident',
    components: ['component_id'],
    is_resolved: true,
    resolved_at: staticCurrentTime,
    type: 'realtime',
    created_at: staticCurrentTime,
    updated_at: staticCurrentTime,
    updates: [{
      id: testIncUpdateId,
      _id: '_id',
      created_at: staticCurrentTime,
      updated_at: staticCurrentTime,
      do_twitter_update: true,
      do_notify_subscribers: false,
      status: 'investigating',
      displayed_at: staticCurrentTime,
      message: 'message'
    }, {
      id: 'IU007',
      _id: '_id',
      created_at: staticCurrentTime,
      updated_at: staticCurrentTime,
      do_twitter_update: true,
      do_notify_subscribers: false,
      status: 'resolved',
      message: 'message',
      displayed_at: staticCurrentTime
    }]
  };

  const existingPendingRealtimeIncident = {
    id: testRealtimeIncidentId,
    _id: '_id',
    name: 'incident',
    components: ['component_id'],
    is_resolved: false,
    resolved_at: null,
    type: 'realtime',
    created_at: staticCurrentTime,
    updated_at: staticCurrentTime,
    updates: [{
      id: testIncUpdateId,
      _id: '_id',
      created_at: staticCurrentTime,
      updated_at: staticCurrentTime,
      do_twitter_update: true,
      do_notify_subscribers: false,
      status: 'investigating',
      message: 'message'
    }]
  };

  const formatIncident = (obj) => {

    // remove _id 
    const incident = omit(['_id'])(obj);
    incident.updates = incident.updates.map(omit(['_id']));

    return incident;

  };

  const daoMockObj = {
    
    name: 'incidents',

    find (pred, sortBy = {}) {
      if (pred.id == testBackfilledIncidentId) return Promise.resolve([existingBackfilledIncident]);
      if (pred.id == testRealtimeIncidentId) return Promise.resolve([existingRealtimeIncident]);
      if (pred.id == testPendingRealtimeIncidentId) return Promise.resolve([existingPendingRealtimeIncident]);
      if (Object.keys(pred).length === 0) return Promise.resolve([existingBackfilledIncident, existingRealtimeIncident, existingPendingRealtimeIncident]);

      // only type
      if (pred.type === 'realtime') {
        return Promise.resolve([existingRealtimeIncident, existingPendingRealtimeIncident]);
      }

      return Promise.resolve([]);
    },

    insert(data) {
      if (data.type == 'realtime') return Promise.resolve(existingRealtimeIncident);
      if (data.type == 'backfilled') return Promise.resolve(existingBackfilledIncident);
    },

    update(data) {
      return Promise.resolve(data);
    },

    remove(pred) {
      if (pred.id == testRealtimeIncidentId) return Promise.resolve(1);
      else return Promise.resolve(0);
    }

  };

  const repo = incidentRepo.init(daoMockObj, messagingQueueMockObj);


  before(function () {
    MockDate.set(staticCurrentTime);
  });

  after(function () {
    MockDate.reset();
  });


  /**
   * TEST CASES
   */

  it ('should throw error if invalid dao passed', function(done) {

    try {
      incidentRepo.init({name: 'bogus'}, {});
    }
    catch (e) {
      assert.strictEqual(e.message, 'Invalid DAO passed to this repo. Passed dao name: bogus');
      done();
    }

  });

  describe('list()', function() {

    const sortBy = { _id: 1 };

    it ('should return components with no filter', async function () {

      const findSpy = sinon.spy(daoMockObj, 'find');

      // one filter
      const incidents = await repo.list();

      sinon.assert.calledOnce(findSpy);
      sinon.assert.calledWith(findSpy, {}, sortBy);

      assert.deepEqual(incidents, [existingBackfilledIncident, existingRealtimeIncident, existingPendingRealtimeIncident].map(formatIncident));

      findSpy.restore();

      findSpy.restore();

    });

    it ('should return components with type filter', async function() {

      const findSpy = sinon.spy(daoMockObj, 'find');

      // one filter
      let pred = { type: 'realtime' };
      const incidents = await repo.list(pred);

      sinon.assert.calledOnce(findSpy);
      sinon.assert.calledWith(findSpy, pred, sortBy);
      assert.deepEqual(incidents, [existingRealtimeIncident, existingPendingRealtimeIncident].map(formatIncident));

      findSpy.restore();

    });

    it ('should return components with type + multiple filters', async function() {

      const findSpy = sinon.spy(daoMockObj, 'find');

      //  filters
      let pred = { type: 'realtime', is_resolved: true, component_id: 'component_id', created_after: '2017-01-01' };
      const incidents = await repo.list(pred);

      const expectedPred = { type: 'realtime', is_resolved: true, components: 'component_id', created_at: { $gte : new Date('2017-01-01') } };

      sinon.assert.calledOnce(findSpy);
      sinon.assert.calledWith(findSpy, expectedPred, sortBy);
      assert.deepEqual(incidents, [existingRealtimeIncident, existingPendingRealtimeIncident].map(formatIncident));

      findSpy.restore();

    });


    it ('should return no incidents with filters', async function() {

      const findSpy = sinon.spy(daoMockObj, 'find');

      // pred
      let pred = { type: 'type' };
      const incidents = await repo.list(pred);

      sinon.assert.calledOnce(findSpy);
      sinon.assert.calledWith(findSpy, pred, sortBy);
      assert.deepEqual(incidents, []);

      findSpy.restore();

    });

    it ('should return incidents even if extra filters passed', async function() {

      const findSpy = sinon.spy(daoMockObj, 'find');

      let pred = { type: 'realtime', extra: 'test' };
      const incidents = await repo.list(pred);

      sinon.assert.calledOnce(findSpy);
      sinon.assert.calledWith(findSpy, { type: 'realtime' }, sortBy);
      assert.deepEqual(incidents, [existingRealtimeIncident, existingPendingRealtimeIncident].map(formatIncident));

      findSpy.restore();

    });

    it ('should return an error on find() if db error', function(done) {

      const findStub = sinon.stub(daoMockObj, 'find').callsFake((pred, sortBy) => {
        throw new Error('db error');
      });
      
      repo.list().catch(e => {

        assert.strictEqual(e.message, 'db error');
        sinon.assert.calledOnce(findStub);

        findStub.restore();
        done();

      });

    });

  });

  describe('load()', function() {

    it ('should load an incident given a valid id', async function() {

      const findSpy = sinon.spy(daoMockObj, 'find');

      const incidentObj = await repo.load(testRealtimeIncidentId);

      // its calling dao find
      // its calling with the right pred
      // returning the stuff from dao.
      sinon.assert.calledOnce(findSpy);
      sinon.assert.calledWith(findSpy, { id: testRealtimeIncidentId });
      assert.deepEqual(incidentObj, formatIncident(existingRealtimeIncident));

      findSpy.restore();

    });

    it ('should error when no incident is found', function(done) {

      const findSpy = sinon.spy(daoMockObj, 'find');

      repo.load('1').catch(e => {
      
        // its calling dao find
        // returning the error  
        sinon.assert.calledOnce(findSpy);
        assert.strictEqual(e.name, 'IdNotFoundError');

        findSpy.restore();

        done();

      });    

    });

  });

  describe('create()', function() {

    beforeEach(function () {
      messagingQueueMockObj.publish.reset();
    });

    describe('type#realtime', function () {

      it ('should validate and create an incident', async function() {        

        const newIncident = Object.assign({}, newPartialIncidentObj, {
          type: 'realtime',
          status: 'investigating'
        });

        const insertSpy = sinon.spy(daoMockObj, 'insert');
        const genIncidentIdStub = sinon.stub(incidentEntity, 'generateId').callsFake(() => {
          return testRealtimeIncidentId;
        });

        const genIncidentUpdIdStub = sinon.stub(incidentUpdateEntity, 'generateId').callsFake(() => {
          return testIncUpdateId;
        });

        const createdIncident = await repo.create(newIncident);

        // call the dao insert 
        sinon.assert.calledOnce(insertSpy);

        // dao called with right params
        const insertArg = insertSpy.args[0][0];

        const expected = Object.assign(pick(['name', 'type', 'components', 'is_resolved'])(newIncident), {
          id: testRealtimeIncidentId,
          created_at: staticCurrentTime,
          updated_at: staticCurrentTime,
          resolved_at: null,
          updates: [
            Object.assign(pick(['message', 'status', 'do_twitter_update', 'do_notify_subscribers'])(newIncident), {
              id: testIncUpdateId,
              created_at: staticCurrentTime,
              updated_at: staticCurrentTime,
              displayed_at: staticCurrentTime
            })
          ]
        });

        assert.deepEqual(expected, insertArg);

        // check id generation
        sinon.assert.calledOnce(genIncidentIdStub);
        sinon.assert.calledOnce(genIncidentUpdIdStub);


        // message queue publish
        sinon.assert.calledOnce(messagingQueueMockObj.publish);
        sinon.assert.calledWith(messagingQueueMockObj.publish, expected, 'incidents', { routingKey: 'upsert' });

        // returning the res from dao insert
        assert.deepEqual(createdIncident, formatIncident(existingRealtimeIncident));

        insertSpy.restore();
        genIncidentIdStub.restore();
        genIncidentUpdIdStub.restore();

      });

      it ('should set the is_resolved and resolved_at when adding with resolved status', async function () {

        const insertSpy = sinon.spy(daoMockObj, 'insert');

        const newIncident = Object.assign({}, newPartialIncidentObj, {
          type: 'realtime',
          status: 'resolved'
        });

        const createdIncident = await repo.create(newIncident);

        // check if dao called with right params
        const insertArg = insertSpy.args[0][0];

        assert.strictEqual(insertArg.is_resolved, true);
        assert.equal(insertArg.resolved_at.toISOString(), staticCurrentTime.toISOString());

        insertSpy.restore();

      });

      it ('should fail b/c of validation', function(done) {
        repo.create({
          type: 'realtime',
          message: 'abc',
          status: 'error'
        }).catch(e => {
          assert.strictEqual(e.name, 'ValidationError');
          done();
        });
      });

    });

    describe('type#backfilled', function () {

      it ('should create the incident-update with resolved status', async function () {

        const insertSpy = sinon.spy(daoMockObj, 'insert');

        const newIncident = Object.assign({}, newPartialIncidentObj, {
          type: 'backfilled'
        });

        const createdIncident = await repo.create(newIncident);

        // check if dao called with right params
        const insertArg = insertSpy.args[0][0];

        assert.strictEqual(insertArg.updates[0].status, 'resolved');
        assert.strictEqual(insertArg.resolved_at.toISOString(), staticCurrentTime.toISOString());

        // returning the res from dao insert
        assert.deepEqual(createdIncident, formatIncident(existingBackfilledIncident));

        insertSpy.restore();

      });

    });

  });

  describe('update', function() {

    it ('should fail b/c of invalid id', function(done) {
      repo.update('1234', {}).catch(e => {
        assert.strictEqual(e.name, 'IdNotFoundError');
        done();
      });
    });

    it ('should fail if trying to update a backfilled incident', function(done) {

      repo.update(testBackfilledIncidentId, {}).catch(e => {
        assert.strictEqual(e.name, 'UpdateNotAllowedError');
        done();
      });

    });

    it ('should not create any new incident-update if no status or message is passed', async function () {

      const updateSpy = sinon.spy(daoMockObj, 'update');

      await repo.update(testPendingRealtimeIncidentId, {components: ['component_id_1', 'component_id_2']});

      sinon.assert.calledOnce(updateSpy);

      const updateArg = updateSpy.args[0][0];
      assert.strictEqual(updateArg.updates.length, existingPendingRealtimeIncident.updates.length);
      assert.deepEqual(updateArg.components, ['component_id_1', 'component_id_2']);

      updateSpy.restore();

    });

    it ('should mark the incident resolved if passing a resolved incident-update', async function () {

      messagingQueueMockObj.publish.reset();

      const updateSpy = sinon.spy(daoMockObj, 'update');

      await repo.update(testPendingRealtimeIncidentId, {
        status: 'resolved',
        message: 'this is resolved'
      });

      sinon.assert.calledOnce(updateSpy);

      const updateArg = updateSpy.args[0][0];

      assert.strictEqual(updateArg.is_resolved, true);
      assert.strictEqual(updateArg.resolved_at.toISOString(), staticCurrentTime.toISOString());

      assert.strictEqual(updateArg.updates.length, 2);

      updateSpy.restore();

      sinon.assert.calledOnce(messagingQueueMockObj.publish);

    });

    describe ('type#realtime', function () {

      it ('should fail b/c of validation error - missing message', function (done) {

        repo.update(testPendingRealtimeIncidentId, {
          status: 'resolved'
        }).catch(e => {
          assert.strictEqual(e.name, 'ValidationError');
          done();
        });

      });

      it ('should fail b/c of validation error - invalid status', function (done) {

        repo.update(testPendingRealtimeIncidentId, {
          status: 'error',
          message: 'here123'
        }).catch(e => {
          assert.strictEqual(e.name, 'ValidationError');
          done();
        });

      });

      it ('should not set is_resolved for non-resolved status', async function () {

        const genIncidentUpdIdStub = sinon.stub(incidentUpdateEntity, 'generateId').callsFake(() => {
          return 'IU765';
        });

        const updateSpy = sinon.spy(daoMockObj, 'update');

        await repo.update(testPendingRealtimeIncidentId, {
          status: 'investigating',
          message: 'we are still investigating',
          do_notify_subscribers: true
        });

        sinon.assert.calledOnce(updateSpy);

        const updateArg = updateSpy.args[0][0];

        assert.strictEqual(updateArg.is_resolved, false);
        assert.strictEqual(updateArg.resolved_at, null);
        assert.strictEqual(updateArg.updates.length, 2);

        const lastUpdate = updateArg.updates[1];

        // validate the last update values
        const expected = {
          message: 'we are still investigating',
          status: 'investigating',
          do_notify_subscribers: true,
          do_twitter_update: false,
          id: 'IU765',
          displayed_at: staticCurrentTime,
          updated_at: staticCurrentTime,
          created_at: staticCurrentTime 
        };

        assert.deepEqual(expected, lastUpdate);

        updateSpy.restore();
        genIncidentUpdIdStub.restore();

      });

      it ('should add the incident-update with status update if incident is resolved', async function () {

        const genIncidentUpdIdStub = sinon.stub(incidentUpdateEntity, 'generateId').callsFake(() => {
          return 'IU765';
        });

        const updateSpy = sinon.spy(daoMockObj, 'update');

        await repo.update(testRealtimeIncidentId, {
          status: 'whatever', // it won't be honored
          message: 'the problem was with db'
        });

        sinon.assert.calledOnce(updateSpy);

        const updateArg = updateSpy.args[0][0];

        // a new incident-update was added
        assert.strictEqual(updateArg.updates.length, 3);

        const lastUpdate = updateArg.updates[2];

        // validate the last update values
        const expected = {
          message: 'the problem was with db',
          status: 'update',
          do_notify_subscribers: false,
          do_twitter_update: false,
          id: 'IU765',
          displayed_at: staticCurrentTime,
          updated_at: staticCurrentTime,
          created_at: staticCurrentTime 
        };

        assert.deepEqual(expected, lastUpdate);

        updateSpy.restore();
        genIncidentUpdIdStub.restore();

      });

    });

  });

  describe('remove()', function() {

    it ('should remove an incident', async function() {

      const removeSpy = sinon.spy(daoMockObj, 'remove');

      await repo.remove(testRealtimeIncidentId);

      // its calling dao remove
      // its calling with the right pred
      sinon.assert.calledOnce(removeSpy);
      sinon.assert.calledWith(removeSpy, { id: testRealtimeIncidentId });

      removeSpy.restore();

    });

    it ('should fail b/c of invalid id', function(done) {

      const removeSpy = sinon.spy(daoMockObj, 'remove');

      repo.remove('1').catch(e => {
      
        // its calling dao remove
        // returning the error  
        sinon.assert.calledOnce(removeSpy);
        assert.strictEqual(e.name, 'IdNotFoundError');

        removeSpy.restore();

        done();

      });    

    });

  });

  describe('change to incident-update', function () {

    it ('should fail b/c of invalid incident-update id', function(done) {
      repo.changeIncidentUpdateEntry(testRealtimeIncidentId, '1234', {}).catch(e => {
        assert.strictEqual(e.name, 'IdNotFoundError');
        done();
      });
    });

    it ('should update the incident-update', async function () {

      const updateSpy = sinon.spy(daoMockObj, 'update');

      const currentTime = new Date();

      await repo.changeIncidentUpdateEntry(testRealtimeIncidentId, testIncUpdateId, {
        displayed_at: currentTime,
        message: 'updated-message',
        status: 'resolved'
      });

      sinon.assert.calledOnce(updateSpy);

      const updateArg = updateSpy.args[0][0];

      // will check against the entire incident object. to make sure that only one incident-update
      // was changed
      const cloned = formatIncident(cloneDeep(existingRealtimeIncident));

      // update the cloned incident-update to wwhat is expected
      const incidentUpdateToChange = find(['id', testIncUpdateId])(cloned.updates);
      incidentUpdateToChange.displayed_at =  currentTime;
      incidentUpdateToChange.message = 'updated-message';

      assert.deepEqual(cloned, updateArg);

      updateSpy.restore();

    });

  });

});