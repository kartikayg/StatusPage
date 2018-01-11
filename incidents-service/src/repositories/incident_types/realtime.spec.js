/**
 * TESTING REPO - the idea is to test that the right params are being 
 * passed to the db dao's and whatever comes back from dao is being returned back.
 *
 * Note: There is no real db operations happening.
 */

import {assert} from 'chai';
import sinon from 'sinon';
import MockDate from 'mockdate';
import mockery from 'mockery';

import _find from 'lodash/fp/find';
import _pick from 'lodash/fp/pick';
import _cloneDeep from 'lodash/fp/cloneDeep';

import commonRepo from './common';

import {incident as incidentEntity, incidentUpdate as incidentUpdateEntity } from '../../entities/index';

describe('repo/incidents/type/realtime', function() {

  /**
   * MOCK VARIABLES
   */

  const staticCurrentTime = new Date();

  // stub for the messaging queue
  const messagingQueueMockObj = {
    publish: sinon.spy()
  };

  // stub for dao fn
  const daoMockObj = {
    name: 'incidents',
    insert: sinon.spy(),
    update: sinon.spy()
  };

  // common repo mock
  const commonRepoMockObj = commonRepo.init(daoMockObj, messagingQueueMockObj);

  let repo;

    // on before, setup mockery for common repo
  before(function() {
    mockery.enable({ warnOnUnregistered: false });
    mockery.registerMock('./common', {
      init() {
        return commonRepoMockObj;
      }
    });

    // loading module here so that the mockery is all setup. if loading before,
    // then mocking winston won't work.
    delete require.cache[require.resolve('./realtime')];
    
    repo = require('./realtime').init(daoMockObj, messagingQueueMockObj);

    MockDate.set(staticCurrentTime);

  });

  after(function () {
    MockDate.reset();

    mockery.deregisterMock('./common');
    mockery.disable();
    delete require.cache[require.resolve('./realtime')];
  });

  it ('init should return the repo object', function () {

    assert.isObject(repo);

    assert.strictEqual(repo.type, 'realtime');

    assert.isFunction(repo.remove);
    assert.isFunction(repo.changeIncidentUpdateEntry);
    assert.isFunction(repo.create);
    assert.isFunction(repo.update);

  });

  describe('create()', function() {

    const newPartialIncidentObj = {
      name: 'incident',
      components: ['component_id'],
      components_impact_status: 'partial_outage',
      message: 'message',
      status: 'investigating',
      do_notify_subscribers: true
    };

    it ('should create a realtime incident', async function () {

      const saveDbSpy = sinon.spy(commonRepoMockObj, 'saveDb');

      await repo.create(newPartialIncidentObj);

      const savedArg = saveDbSpy.args[0][0];

      sinon.assert.calledOnce(saveDbSpy);

      saveDbSpy.restore();

    });

    it ('should create a realtime incident with resolved status', async function () {

      const saveDbSpy = sinon.spy(commonRepoMockObj, 'saveDb');

      await repo.create(Object.assign({}, newPartialIncidentObj, {
        status: 'resolved'
      }));

      const savedArg = saveDbSpy.args[0][0];

      sinon.assert.calledOnce(saveDbSpy);

      assert.strictEqual(savedArg.is_resolved, true);
      assert.strictEqual(savedArg.resolved_at.toISOString(), staticCurrentTime.toISOString());

      saveDbSpy.restore();

    });

  });

  describe('update()', function() {

    const testRealtimeIncidentId = 'IC456';
    const testIncUpdateId = 'IU123';

    const existingPendingRealtimeIncident = {
      id: testRealtimeIncidentId,
      name: 'incident',
      components: ['component_id'],
      components_impact_status: 'partial_outage',
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

    it ('should error if invalid incident type passed', function (done) {
      repo.update({ type: 'backfilled' }).catch(e => {
        assert.strictEqual(e.message, 'Invalid Object passed.');
        done();
      });
    });

    it ('should create another incident-update and save', async function () {

      const saveDbSpy = sinon.spy(commonRepoMockObj, 'saveDb');

      await repo.update(existingPendingRealtimeIncident, {
        status: 'identified',
        message: 'test'
      });

      const savedArg = saveDbSpy.args[0][0];

      // make sure a new incident-update was added
      assert.strictEqual(savedArg.updates.length, 2);

      const lastUpdate = savedArg.updates[1];

      assert.strictEqual(lastUpdate.status, 'identified');
      assert.strictEqual(lastUpdate.message, 'test');

      sinon.assert.calledOnce(saveDbSpy);

      saveDbSpy.restore();

    });

    it ('should mark the incident resolved if posting with status resolved', async function () {

      const saveDbSpy = sinon.spy(commonRepoMockObj, 'saveDb');

      await repo.update(existingPendingRealtimeIncident, {
        status: 'resolved',
        message: 'test'
      });

      const savedArg = saveDbSpy.args[0][0];

      // make sure a new incident-update was added
      assert.strictEqual(savedArg.updates.length, 2);

      const lastUpdate = savedArg.updates[1];

      assert.strictEqual(lastUpdate.status, 'resolved');
      assert.strictEqual(lastUpdate.message, 'test');

      // make sure the incident is marked resolved
      assert.strictEqual(savedArg.is_resolved, true);
      assert.strictEqual(savedArg.resolved_at.toISOString(), staticCurrentTime.toISOString());

      sinon.assert.calledOnce(saveDbSpy);

      saveDbSpy.restore();

    });

    it ('should create the incident-update with "update" status once incident is resolved', async function () {

      const saveDbSpy = sinon.spy(commonRepoMockObj, 'saveDb');

      const cloned = _cloneDeep(existingPendingRealtimeIncident);

      cloned.is_resolved = true;
      cloned.resolved_at = staticCurrentTime;

      await repo.update(cloned, {
        status: 'resolved',
        message: 'test'
      });

      const savedArg = saveDbSpy.args[0][0];

      // make sure a new incident-update was added
      assert.strictEqual(savedArg.updates.length, 2);

      const lastUpdate = savedArg.updates[1];

      assert.strictEqual(lastUpdate.status, 'update');
      assert.strictEqual(lastUpdate.message, 'test');

      sinon.assert.calledOnce(saveDbSpy);

      saveDbSpy.restore();

    });

    it ('should not create incident-update if no status or message passed', async function () {

      const saveDbSpy = sinon.spy(commonRepoMockObj, 'saveDb');

      await repo.update(existingPendingRealtimeIncident, {
        components: ['cid_1', 'cid_2']
      });

      const savedArg = saveDbSpy.args[0][0];

      // make sure no new incident-update was added
      assert.strictEqual(savedArg.updates.length, 1);

      // also see components were updated
      assert.deepEqual(savedArg.components, ['cid_1', 'cid_2']);

      saveDbSpy.restore();

    });

     it ('should update components_impact_status as its higher than current value', async function () {

      const saveDbSpy = sinon.spy(commonRepoMockObj, 'saveDb');

      await repo.update(existingPendingRealtimeIncident, {
        components_impact_status: 'major_outage'
      });

      const savedArg = saveDbSpy.args[0][0];

      // the value was updated
      assert.equal(savedArg.components_impact_status, 'major_outage');

      saveDbSpy.restore();

    });

    it ('should not update components_impact_status as its lower than current value', async function () {

      const saveDbSpy = sinon.spy(commonRepoMockObj, 'saveDb');

      await repo.update(existingPendingRealtimeIncident, {
        components_impact_status: 'degraded_performance'
      });

      const savedArg = saveDbSpy.args[0][0];

      // the value was not updated
      assert.equal(savedArg.components_impact_status, existingPendingRealtimeIncident.components_impact_status);

      saveDbSpy.restore();

    });


  });

});