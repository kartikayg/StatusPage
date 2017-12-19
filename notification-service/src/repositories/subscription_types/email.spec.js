/**
 * TESTING REPO - the idea is to test that the right params are being 
 * passed to the db dao's and whatever comes back from dao is being returned back.
 *
 * Note: There is no real db operations happening.
 */

import {assert} from 'chai';
import sinon from 'sinon';
import MockDate from 'mockdate';

import config from '../../config';
import emailRepo from './email';
import { DuplicatedSubscriptionError } from '../errors';

import { subscriber as subscriberEntity } from '../../entities/index';

describe('repo/subscription/types/email', function() {

  /**
   * MOCK VARIABLES
   */

  const staticCurrentTime = new Date();

  const duplicatedEmail = 'duplicated@gmail.com';

  const testSubscriptionId = 'SB123';
  const newSubscriptionObj = {
    type: 'email',
    email: 'test@gmail.com',
    components: ['cid_1']
  };
  const existingSubscriptionObj = Object.assign({}, newSubscriptionObj, {
    id: testSubscriptionId,
    created_at: staticCurrentTime,
    updated_at: staticCurrentTime,
    is_confirmed: false
  });

  const daoMockObj = {
    
    name: 'subscriptions',

    insert(data) {
      Promise.resolve(existingSubscriptionObj);
    },

    count(pred) {
      return Promise.resolve(pred.email === duplicatedEmail ? 1 : 0);
    }

  };

  const repo = emailRepo.init(daoMockObj);

  before(function () {
    MockDate.set(staticCurrentTime);
    config.load(process.env);
  });

  after(function () {
    MockDate.reset();
    config.reset();
  });

  it ('init should return the repo object', function () {

    assert.isObject(repo);

    assert.strictEqual(repo.type, 'email');

    assert.isFunction(repo.unsubscribe);
    assert.isFunction(repo.markConfirmed);
    assert.isFunction(repo.manageComponents);

    assert.isFunction(repo.subscribe);
    assert.isFunction(repo.sendConfirmationLink);
    assert.isFunction(repo.notifyOfNewIncidentUpdate);

  });

  describe('subscribe()', function() {

    it ('should create a new email subscription', async function () {

      this.timeout(10000);

      const insertSpy = sinon.spy(daoMockObj, 'insert');
      const sendConfLinkSpy = sinon.spy(repo, 'sendConfirmationLink');

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
        is_confirmed: false, // by default, email sub is not confirmed
      });

      assert.deepEqual(insertArg, expected, 'insert params');

      sinon.assert.calledOnce(insertSpy);
      sinon.assert.calledOnce(sendConfLinkSpy);

      genIncidentIdStub.restore();
      insertSpy.restore();
      sendConfLinkSpy.restore();

    });

    it ('should fail for invalid data', function (done) {

      const insertSpy = sinon.spy(daoMockObj, 'insert');

      repo.subscribe(Object.assign({}, newSubscriptionObj, {
        email: undefined
      })).catch(e => {
        assert.strictEqual(e.name, 'ValidationError');
        sinon.assert.notCalled(insertSpy);
        insertSpy.restore();
        done();
      })

    });

    it ('should fail for duplicate email address', function (done) {

      const insertSpy = sinon.spy(daoMockObj, 'insert');

      repo.subscribe(Object.assign({}, newSubscriptionObj, {
        email: duplicatedEmail
      })).catch(e => {
        assert.strictEqual(e.name, 'DuplicatedSubscriptionError');
        sinon.assert.notCalled(insertSpy);
        insertSpy.restore();
        done();
      })

    });

  });

});