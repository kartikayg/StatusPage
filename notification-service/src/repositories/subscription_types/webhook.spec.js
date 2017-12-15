import {assert} from 'chai';
import sinon from 'sinon';
import MockDate from 'mockdate';

import webhookRepo from './webhook';
import { DuplicatedSubscriptionError } from '../errors';

import { subscriber as subscriberEntity } from '../../entities/index';

describe('repo/subscription/types/webhook', function() {

  /**
   * MOCK VARIABLES
   */

  const staticCurrentTime = new Date();

  const duplicatedUri = 'http://ktechstatus.com/dupendpoint';

  const testSubscriptionId = 'SB123';
  const newSubscriptionObj = {
    type: 'webhook',
    uri: 'http://ktechstatus.com/endpoint',
    components: ['cid_1']
  };
  const existingSubscriptionObj = Object.assign({}, newSubscriptionObj, {
    id: testSubscriptionId,
    created_at: staticCurrentTime,
    updated_at: staticCurrentTime,
    is_confirmed: true
  });

  const daoMockObj = {
    
    name: 'subscriptions',

    insert(data) {
      Promise.resolve(existingSubscriptionObj);
    },

    count(pred) {
      return Promise.resolve(pred.uri === duplicatedUri ? 1 : 0);
    }

  };

  const repo = webhookRepo.init(daoMockObj);

  before(function () {
    MockDate.set(staticCurrentTime);
  });

  after(function () {
    MockDate.reset();
  });

  it ('init should return the repo object', function () {

    assert.isObject(repo);

    assert.strictEqual(repo.type, 'webhook');

    assert.isFunction(repo.unsubscribe);
    assert.isFunction(repo.manageComponents);

    assert.isFunction(repo.subscribe);
    assert.isFunction(repo.notifyOfNewIncidentUpdate);

  });

  describe('subscribe()', function() {

    it ('should create a new webhook subscription', async function () {

      const insertSpy = sinon.spy(daoMockObj, 'insert');
      const genIncidentIdStub = sinon.stub(subscriberEntity, 'generateId').callsFake(() => {
        return testSubscriptionId;
      });

      const obj = await repo.subscribe(newSubscriptionObj);

      assert.deepEqual(obj, existingSubscriptionObj, 'return object');

      // dao called with right params
      const insertArg = insertSpy.args[0][0];
      const expected = Object.assign({}, newSubscriptionObj, {
        id: testSubscriptionId,
        created_at: staticCurrentTime,
        updated_at: staticCurrentTime,
        is_confirmed: true, // webhook sub is always confirmed
      });

      assert.deepEqual(insertArg, expected, 'insert params');

      sinon.assert.calledOnce(insertSpy);

      genIncidentIdStub.restore();
      insertSpy.restore();

    });

    it ('should fail for invalid data', function (done) {

      const insertSpy = sinon.spy(daoMockObj, 'insert');

      repo.subscribe(Object.assign({}, newSubscriptionObj, {
        uri: undefined
      })).catch(e => {
        assert.strictEqual(e.name, 'ValidationError');
        sinon.assert.notCalled(insertSpy);
        insertSpy.restore();
        done();
      })

    });

    it ('should fail for duplicate endpoint', function (done) {

      const insertSpy = sinon.spy(daoMockObj, 'insert');

      repo.subscribe(Object.assign({}, newSubscriptionObj, {
        uri: duplicatedUri
      })).catch(e => {
        assert.strictEqual(e.name, 'DuplicatedSubscriptionError');
        sinon.assert.notCalled(insertSpy);
        insertSpy.restore();
        done();
      })

    });

  });

});