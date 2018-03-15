/**
 * TESTING REPO - the idea is to test that the right params are being 
 * passed to the db dao's and whatever comes back from dao is being returned back.
 *
 * Note: There is no real db operations that happen.
 */

import {assert} from 'chai';
import sinon from 'sinon';
import MockDate from 'mockdate';

import _find from 'lodash/fp/find';
import _cloneDeep from 'lodash/fp/cloneDeep';

import commonRepo from './common';
import {incident as incidentEntity, incidentUpdate as incidentUpdateEntity } from '../../entities/index';

describe('repo/incident/common', function() {

  /**
   * MOCK VARIABLES
   */

  // stub for the messaging queue
  const messagingQueueMockObj = {
    publish: sinon.spy()
  };

  const staticCurrentTime = new Date();
  
  const testRealtimeIncidentId = 'IC456';
  const testPendingRealtimeIncidentId = 'IC097';

  const testIncUpdateId = 'IU123';

  const newPartialIncidentObj = {
    name: 'incident',
    components: ['component_id'],
    components_impact_status: 'partial_outage',
    latest_status: 'investigating',
    type: 'realtime',
    is_resolved: false,
    resolved_at: null,
    updates: [{
      id: 'IU123',
      created_at: staticCurrentTime,
      updated_at: staticCurrentTime,
      do_notify_subscribers: false,
      status: 'investigating',
      displayed_at: staticCurrentTime,
      message: 'message'
    }]
  };

  const existingRealtimeIncident = {
    id: testRealtimeIncidentId,
    name: 'incident',
    components: ['component_id'],
    components_impact_status: 'partial_outage',
    latest_status: 'resolved',
    is_resolved: true,
    resolved_at: staticCurrentTime,
    type: 'realtime',
    created_at: staticCurrentTime,
    updated_at: staticCurrentTime,
    updates: [{
      id: testIncUpdateId,
      created_at: staticCurrentTime,
      updated_at: staticCurrentTime,
      do_notify_subscribers: false,
      status: 'investigating',
      displayed_at: staticCurrentTime,
      message: 'message'
    }, {
      id: 'IU007',
      created_at: staticCurrentTime,
      updated_at: staticCurrentTime,
      do_notify_subscribers: false,
      status: 'resolved',
      message: 'message',
      displayed_at: staticCurrentTime
    }]
  };

  const existingPendingRealtimeIncident = {
    id: testRealtimeIncidentId,
    name: 'incident',
    components: ['component_id'],
    components_impact_status: 'partial_outage',
    latest_status: 'investigating',
    is_resolved: false,
    resolved_at: null,
    type: 'realtime',
    created_at: staticCurrentTime,
    updated_at: staticCurrentTime,
    updates: [{
      id: testIncUpdateId,
      created_at: staticCurrentTime,
      updated_at: staticCurrentTime,
      do_notify_subscribers: false,
      status: 'investigating',
      message: 'message'
    }]
  };

  const daoMockObj = {
    
    name: 'incidents',

    insert(data) {
      return Promise.resolve(existingRealtimeIncident);
    },

    update(data) {
      return Promise.resolve(data);
    },

    remove(pred) {
      if (pred.id == testRealtimeIncidentId) return Promise.resolve(1);
      else return Promise.resolve(0);
    }

  };

  const repo = commonRepo.init(daoMockObj, messagingQueueMockObj);


  before(function () {
    MockDate.set(staticCurrentTime);
  });

  after(function () {
    MockDate.reset();
  });


  /**
   * TEST CASES
   */

  describe ('buildIncidentUpdateObj', function () {

    it ('should create an incident-update object with passed data', function () {

      const genIncidentUpdIdStub = sinon.stub(incidentUpdateEntity, 'generateId').callsFake(() => {
        return 'IC123';
      });

      const data = {
        message: 'message',
        status: 'status',
        do_notify_subscribers: true,
        displayed_at: staticCurrentTime,
        extra: '123' // this shouldn't be returned
      };

      const incidentUpdObj = repo.buildIncidentUpdateObj(data);

      const expected = Object.assign({}, data, {
        id: 'IC123',
        created_at: staticCurrentTime,
        updated_at: staticCurrentTime
      });
      delete expected.extra;

      assert.deepEqual(incidentUpdObj, expected);

      genIncidentUpdIdStub.restore();

    });

    it ('should populated the default values', function () {

      const genIncidentUpdIdStub = sinon.stub(incidentUpdateEntity, 'generateId').callsFake(() => {
        return 'IC123';
      });

      const data = {
        message: 'message',
        status: 'status'
      };

      const incidentUpdObj = repo.buildIncidentUpdateObj(data);

      const expected = Object.assign({}, data, {
        id: 'IC123',
        created_at: staticCurrentTime,
        updated_at: staticCurrentTime,
        displayed_at: staticCurrentTime,
        do_notify_subscribers: false
      });

      assert.deepEqual(incidentUpdObj, expected);

      genIncidentUpdIdStub.restore();

    });

  });

  describe('remove()', function() {

    it ('should remove an incident', async function() {

      const removeSpy = sinon.spy(daoMockObj, 'remove');

      await repo.remove(existingRealtimeIncident);

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
      repo.changeIncidentUpdateEntry(existingRealtimeIncident, '1234', {}).catch(e => {
        assert.strictEqual(e.name, 'IdNotFoundError');
        done();
      });
    });

    it ('should update the incident-update', async function () {

      const saveDbSpy = sinon.spy(repo, 'saveDb');

      const now = new Date();

      await repo.changeIncidentUpdateEntry(existingRealtimeIncident, testIncUpdateId, {
        displayed_at: now,
        message: 'updated-message'
      });

      sinon.assert.calledOnce(saveDbSpy);

      // argument passed. make sure the right value was passed to it.
      const saveArg = saveDbSpy.args[0][0];

      // will check against the entire incident object. to make sure that only one incident-update
      // was changed
      const cloned = _cloneDeep(existingRealtimeIncident);

      // update the cloned incident-update to wwhat is expected
      const incidentUpdateToChange = _find(['id', testIncUpdateId])(cloned.updates);
      incidentUpdateToChange.displayed_at =  now;
      incidentUpdateToChange.message = 'updated-message';

      assert.deepEqual(saveArg, cloned);

      saveDbSpy.restore();

    });

  });

  describe ('setResolvedStatus', function () {

    it ('should mark the incident resolved if there is an incident-update with resolved status', function () {

      const cloned = _cloneDeep(existingPendingRealtimeIncident);

      // make sure its false before
      assert.strictEqual(cloned.is_resolved, false);

      cloned.updates.push({
        id: testIncUpdateId,
        created_at: staticCurrentTime,
        updated_at: staticCurrentTime,
        do_notify_subscribers: false,
        status: 'resolved',
        message: 'message'
      });

      repo.setResolvedStatus(cloned);

      assert.strictEqual(cloned.is_resolved, true);
      assert.strictEqual(cloned.resolved_at.toISOString(), staticCurrentTime.toISOString());

    });


    it ('should not mark the incident resolved', function () {

      const cloned = _cloneDeep(existingPendingRealtimeIncident);

      repo.setResolvedStatus(cloned);

      assert.strictEqual(cloned.is_resolved, false);
      assert.strictEqual(cloned.resolved_at, null);

    });

  });

  describe ('saveDb', function () {

    it ('should insert for a new incident', async function () {
      
      const genIncidentUpdIdStub = sinon.stub(incidentEntity, 'generateId').callsFake(() => {
        return 'IC123';
      });

      const insertSpy = sinon.spy(daoMockObj, 'insert');

      const saved = await repo.saveDb(newPartialIncidentObj);

      const insertArg = insertSpy.args[0][0];

      const expected = Object.assign(_cloneDeep(newPartialIncidentObj), {
        id: 'IC123',
        updated_at: staticCurrentTime,
        created_at: staticCurrentTime
      });

      sinon.assert.calledOnce(insertSpy);
      assert.deepEqual(insertArg, expected);

      insertSpy.restore();
      genIncidentUpdIdStub.restore();

    });

    it ('should update the incident', async function () {

      const updateSpy = sinon.spy(daoMockObj, 'update');

      const saved = await repo.saveDb(existingPendingRealtimeIncident);

      const updateArg = updateSpy.args[0][0];

      sinon.assert.calledOnce(updateSpy);
      assert.deepEqual(updateArg, existingPendingRealtimeIncident);

      updateSpy.restore();

    });

    it ('should fail b/c of validation error', function (done) {

      repo.saveDb({}).catch(e => {
        assert.strictEqual(e.name, 'ValidationError');
        done();
      });

    })

  });

  describe ('fireNewIncidentUpdate', function () {

    it ('should call publish on message queue', async function () {

      messagingQueueMockObj.publish.reset();

      await repo.fireNewIncidentUpdate(existingRealtimeIncident);

      sinon.assert.calledOnce(messagingQueueMockObj.publish);
      sinon.assert.calledWith(messagingQueueMockObj.publish, existingRealtimeIncident, 'incidents', { routingKey: 'new-update' });

    });

  });

});