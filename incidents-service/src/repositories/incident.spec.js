/**
 * TESTING REPO - the idea is to test that the right params are being 
 * passed to the db dao's and whatever comes back from dao is being returned back.
 *
 * Note: There is no real db operations that happen.
 */

import {assert} from 'chai';
import sinon from 'sinon';
import MockDate from 'mockdate';

import _pick from 'lodash/fp/pick';
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

  describe('ofType()', function () {

    it ('should error if invalid type', function (done) {
      repo.ofType('type').catch(e => {
        assert.strictEqual(e.name, 'InvalidIncidentTypeError');
        done();
      });
    });

    it ('should return the repo for different subscription types', async function () {

      await incidentRepo.validTypes.forEach(async (t) => {
        const r = await repo.ofType(t);
        assert.strictEqual(r.type, t);
      });

    });

  });

});