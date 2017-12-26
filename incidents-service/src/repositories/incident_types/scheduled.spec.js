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

import moment from 'moment';

import _find from 'lodash/fp/find';
import _pick from 'lodash/fp/pick';
import _cloneDeep from 'lodash/fp/cloneDeep';

import commonRepo from './common';

import {incident as incidentEntity, incidentUpdate as incidentUpdateEntity } from '../../entities/index';

describe('repo/incidents/type/scheduled', function() {

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
    delete require.cache[require.resolve('./scheduled')];
    
    repo = require('./scheduled').init(daoMockObj, messagingQueueMockObj);

    MockDate.set(staticCurrentTime);

  });

  after(function () {
    MockDate.reset();

    mockery.deregisterMock('./common');
    mockery.disable();
    delete require.cache[require.resolve('./scheduled')];
  });

  it ('init should return the repo object', function () {

    assert.isObject(repo);

    assert.strictEqual(repo.type, 'scheduled');

    assert.isFunction(repo.remove);
    assert.isFunction(repo.changeIncidentUpdateEntry);
    assert.isFunction(repo.create);
    assert.isFunction(repo.update);

  });

  describe('create()', function() {

    const newPartialIncidentObj = {
      name: 'incident',
      components: ['component_id'],
      message: 'this is scheduled',
      do_notify_subscribers: true,
      scheduled_start_time: staticCurrentTime,
      scheduled_end_time: staticCurrentTime,
      scheduled_auto_updates_send_notifications: false
    };

    it ('should create a scheduled incident', async function () {

      const genIncidentUpdIdStub = sinon.stub(incidentUpdateEntity, 'generateId').callsFake(() => {
        return 'IU123';
      });

      const saveDbSpy = sinon.spy(commonRepoMockObj, 'saveDb');

      await repo.create(newPartialIncidentObj);

      const savedArg = saveDbSpy.args[0][0];

      const expectedArg = {
        name: newPartialIncidentObj.name,
        components: newPartialIncidentObj.components,
        scheduled_auto_updates_send_notifications: newPartialIncidentObj.scheduled_auto_updates_send_notifications,
        scheduled_auto_status_updates: true, // default value
        scheduled_start_time: newPartialIncidentObj.scheduled_start_time,
        scheduled_end_time: newPartialIncidentObj.scheduled_end_time,
        type: 'scheduled',
        scheduled_status: 'scheduled',
        is_resolved: false,
        resolved_at: null,
        updates: [{
          displayed_at: staticCurrentTime,
          do_notify_subscribers: true,
          message: 'this is scheduled',
          id: 'IU123',
          created_at: staticCurrentTime,
          updated_at: staticCurrentTime,
          status: 'scheduled'
        }]
      };

      assert.deepEqual(savedArg, expectedArg);

      sinon.assert.calledOnce(saveDbSpy);

      saveDbSpy.restore();
      genIncidentUpdIdStub.restore();

    });

    it ('should error if start time is in past', function(done) {

        repo.create(Object.assign({}, newPartialIncidentObj, {
          scheduled_start_time: new Date('2017-01-01')
        })).catch(e => {
          assert.strictEqual(e.name, 'InvalidDateError');
          done();
        });

    });

    it ('should error if end time is before the start time', function(done) {

        repo.create(Object.assign({}, newPartialIncidentObj, {
          scheduled_end_time: new Date('2017-01-01')
        })).catch(e => {
          assert.strictEqual(e.name, 'InvalidDateError');
          done();
        });

    });

  });

  describe('update()', function () {

    const existingIncident =  {
      id: 'IC123',
      name: 'incident',
      components: ['component_id'],
      scheduled_auto_updates_send_notifications: true,
      scheduled_auto_status_updates: true,
      scheduled_start_time: staticCurrentTime,
      scheduled_end_time: staticCurrentTime,
      type: 'scheduled',
      scheduled_status: 'scheduled',
      is_resolved: false,
      resolved_at: null,
      created_at: staticCurrentTime,
      updated_at: staticCurrentTime,
      updates: [{
        displayed_at: staticCurrentTime,
        do_notify_subscribers: true,
        message: 'this is scheduled',
        id: 'IU123',
        created_at: staticCurrentTime,
        updated_at: staticCurrentTime,
        status: 'scheduled'
      }]
    };

    let inProgressIncidentObj;
    let resolvedIncidentObj;

    it ('should error if invalid incident type passed', function (done) {
      repo.update({ type: 'backfilled' }).catch(e => {
        assert.strictEqual(e.message, 'Invalid Object passed.');
        done();
      });
    });

    it ('should update all fields as incident is only in scheduled status', async function () {

      const updateData = {
        name: 'incident-update',
        components: ['cid_1', 'cid_2'],
        scheduled_auto_status_updates: false,
        scheduled_start_time: moment().add(15, 'm').toDate(),
        scheduled_end_time: moment().add(25, 'm').toDate()
      };

      const saveDbSpy = sinon.spy(commonRepoMockObj, 'saveDb');

      const upd = await repo.update(existingIncident, updateData);

      // assert that the fields got updated
      Object.keys(updateData).forEach(k => {
        assert.deepEqual(upd[k], updateData[k]);
      });

      // make sure this wasn't updated
      assert.strictEqual(upd.scheduled_status, 'scheduled');

      sinon.assert.calledOnce(saveDbSpy);
      saveDbSpy.restore();

    });

    it ('should not create incident-update if no status or message passed', async function () {
      const upd = await repo.update(existingIncident, {name: 'test'});
      assert.strictEqual(upd.updates.length, 1);
    });

    it ('should allow to add incident-update of in_progress if currently in scheduled', async function () {

      const updateData = {
        status: 'in_progress',
        message: 'its in progress'
      };

      const saveDbSpy = sinon.spy(commonRepoMockObj, 'saveDb');

      const upd = await repo.update(existingIncident, updateData);

      // a new incident-update added
      assert.strictEqual(upd.updates.length, 2);

      const lastUpdate = upd.updates[1];

      assert.strictEqual(lastUpdate.status, 'in_progress');
      assert.strictEqual(lastUpdate.message, updateData.message);

      assert.strictEqual(upd.scheduled_status, 'in_progress');

      sinon.assert.calledOnce(saveDbSpy);
      saveDbSpy.restore();

      inProgressIncidentObj = upd;

    });

    it ('should fail to add a scheduled incident-update once in progress', function (done) {

      const updateData = {
        status: 'scheduled',
        message: 'here'
      };

      repo.update(inProgressIncidentObj, updateData).catch(e => {
        assert.strictEqual(e.name, 'InvalidIncidentStatusError');
        done();
      });

    });

    it ('should fail b/c of invalid start and end time', function (done) {

      // start time in past
      repo.update(existingIncident, {
        scheduled_start_time: moment().subtract(10, 'M').toDate()
      }).catch(e => {
        assert.strictEqual(e.name, 'InvalidDateError');
        
        // end time < start time
        repo.update(existingIncident, {
          scheduled_start_time: moment().add(10, 'M').toDate(),
          scheduled_end_time: moment().add(5, 'M').toDate()
        }).catch(e => {
          assert.strictEqual(e.name, 'InvalidDateError');
          done();
        });

      });



    });

    it ('should not update start time as its in progress now once in progress', async function () {

      const updateData = {
        scheduled_start_time: moment().add('100', 'M').toDate()
      };

      const upd = await repo.update(inProgressIncidentObj, updateData);

      assert.deepEqual(upd.scheduled_start_time, inProgressIncidentObj.scheduled_start_time);

    });

    it ('should add verifying status once in_progress', async function () {

      const updateData = {
        status: 'verifying',
        message: 'verifying the incident'
      };

      const upd = await repo.update(inProgressIncidentObj, updateData);

      // a new incident-update added
      assert.strictEqual(upd.updates.length, 3);

      const lastUpdate = upd.updates[2];

      assert.strictEqual(lastUpdate.status, 'verifying');
      assert.strictEqual(lastUpdate.message, updateData.message);

      inProgressIncidentObj = upd;

    });

    it ('should resolve the incident', async function () {

      const updateData = {
        status: 'resolved',
        message: 'resolving the incident'
      };

      const upd = await repo.update(inProgressIncidentObj, updateData);

      // a new incident-update added
      assert.strictEqual(upd.updates.length, 4);

      const lastUpdate = upd.updates[3];
      assert.strictEqual(lastUpdate.status, 'resolved');
      assert.strictEqual(lastUpdate.message, updateData.message);

      assert.strictEqual(upd.is_resolved, true);
      assert.deepEqual(upd.resolved_at, staticCurrentTime);
      assert.deepEqual(upd.scheduled_status, 'completed');

      resolvedIncidentObj = upd;

    });

    it ('should add an incident-update after resolving', async function () {

       const updateData = {
        message: 'update'
      };

      const upd = await repo.update(resolvedIncidentObj, updateData);

      // a new incident-update added
      assert.strictEqual(upd.updates.length, 5);
      assert.strictEqual(upd.updates[4].status, 'update');

    });

    it ('should now allow to update any meta data once its resolved', async function () {

       const updateData = {
        name: 'new',
        components: ['c1']
      };

      const upd = await repo.update(resolvedIncidentObj, updateData);

      // nothing got updated
      assert.strictEqual(upd.name, resolvedIncidentObj.name);
      assert.deepEqual(upd.components, resolvedIncidentObj.components);

    });

    it ('should cancel the incident-update', async function () {

      const updateData = {
        status: 'cancelled',
        message: 'i have to cancel it'
      };

      const upd = await repo.update(existingIncident, updateData);

      // a new incident-update added
      assert.strictEqual(upd.updates.length, 2);

      const lastUpdate = upd.updates[1];

      assert.strictEqual(lastUpdate.status, 'cancelled');
      assert.strictEqual(lastUpdate.message, updateData.message);

      assert.strictEqual(upd.scheduled_status, 'cancelled');

    });


  });

});