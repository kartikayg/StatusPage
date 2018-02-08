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

describe('repo/incidents/type/backfilled', function() {

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
    delete require.cache[require.resolve('./backfilled')];
    
    repo = require('./backfilled').init(daoMockObj, messagingQueueMockObj);

    MockDate.set(staticCurrentTime);

  });

  after(function () {
    MockDate.reset();

    mockery.deregisterMock('./common');
    mockery.disable();
    delete require.cache[require.resolve('./backfilled')];
  });

  it ('init should return the repo object', function () {

    assert.isObject(repo);

    assert.strictEqual(repo.type, 'backfilled');

    assert.isFunction(repo.remove);
    assert.isFunction(repo.create);
    assert.isFunction(repo.update);

  });

  describe('create()', function() {

    const newPartialIncidentObj = {
      name: 'incident',
      components: ['component_id'],
      message: 'message',
      do_notify_subscribers: true,
      components_impact_status: 'partial_outage'
    };

    it ('should create a backfilled incident', async function () {

      const saveDbSpy = sinon.spy(commonRepoMockObj, 'saveDb');

      await repo.create(newPartialIncidentObj);

      const savedArg = saveDbSpy.args[0][0];

      sinon.assert.calledOnce(saveDbSpy);

      // always create with resolved status
      assert.strictEqual(savedArg.is_resolved, true);
      assert.strictEqual(savedArg.resolved_at.toISOString(), staticCurrentTime.toISOString());

      saveDbSpy.restore();

    });

  });

  describe('update()', function() {

    it ('should error if invalid incident type passed', function (done) {
      repo.update({ type: 'realtime' }).catch(e => {
        assert.strictEqual(e.message, 'Invalid Object passed.');
        done();
      });
    });

    it ('should throw error for trying to update backfilled incident', function (done) {
      repo.update({ type: 'backfilled' }).catch(e => {
        assert.strictEqual(e.name, 'UpdateNotAllowedError');
        done();
      });
    });



  });

});