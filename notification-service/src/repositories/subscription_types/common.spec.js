import {assert} from 'chai';
import sinon from 'sinon';
import MockDate from 'mockdate';

import commonRepo from './common';

describe('repo/subscription/types/common', function() {

  /**
   * MOCK VARIABLES
   */

  const staticCurrentTime = new Date();

  const duplicatedEmail = 'duplicated@gmail.com';

  const testSubscriptionId = 'SB123';
  const newSubscriptionObj = {
    type: 'email',
    email: 'valid@gmail.com',
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

    update(data) {
      Promise.resolve(existingSubscriptionObj);
    },

    remove(pred) {
      return Promise.resolve(pred.id == testSubscriptionId ? 1 : 0);
    }

  };

  const repo = commonRepo.init(daoMockObj);

  before(function () {
    MockDate.set(staticCurrentTime);
  });

  after(function () {
    MockDate.reset();
  });

  it ('init should return the repo object', function () {

    assert.isObject(repo);

    assert.isFunction(repo.unsubscribe);
    assert.isFunction(repo.markConfirmed);
    assert.isFunction(repo.manageComponents);
    assert.isFunction(repo.buildValidEntity);
    assert.isFunction(repo.updateDb);

  });

  describe('unsubscribe()', function () {

    it ('should unsubscribe/remove subscription', async function() {

      const removeSpy = sinon.spy(daoMockObj, 'remove');

      await repo.unsubscribe(existingSubscriptionObj);

      // its calling dao remove
      // its calling with the right pred
      sinon.assert.calledOnce(removeSpy);
      sinon.assert.calledWith(removeSpy, { id: testSubscriptionId });

      removeSpy.restore();

    });

    it ('should fail b/c of invalid id', function(done) {

      const removeSpy = sinon.spy(daoMockObj, 'remove');

      repo.unsubscribe({}).catch(e => {
      
        // its calling dao remove
        // returning the error  
        sinon.assert.calledOnce(removeSpy);
        assert.strictEqual(e.name, 'IdNotFoundError');

        removeSpy.restore();

        done();

      });    

    });

  });

  describe('markConfirmed()', function () {

    it ('should set the is_confirmed flag to true', async function () {

      const updateSpy = sinon.spy(daoMockObj, 'update');

      const obj = await repo.markConfirmed(existingSubscriptionObj);

      // dao called with right params
      const updateArg = updateSpy.args[0][0];
      const expected = Object.assign({}, existingSubscriptionObj, {
        is_confirmed: true
      });
      assert.deepEqual(updateArg, expected);

      sinon.assert.calledOnce(updateSpy);

      updateSpy.restore();

    });

    it ('should not do any action if already is_confirmed', async function () {

      const updateSpy = sinon.spy(daoMockObj, 'update');

      const obj = await repo.markConfirmed(Object.assign({},existingSubscriptionObj, {
        is_confirmed: true
      }));

      sinon.assert.notCalled(updateSpy);
      updateSpy.restore();

    });

  });

  describe('manageComponents()', function () {

    it ('should set the components as passed', async function () {

      const updateSpy = sinon.spy(daoMockObj, 'update');

      const obj = await repo.manageComponents(existingSubscriptionObj, ['cid_1', 'cid_2']);

      // dao called with right params
      const updateArg = updateSpy.args[0][0];
      const expected = Object.assign({}, existingSubscriptionObj, {
        components: ['cid_1', 'cid_2']
      });
      assert.deepEqual(updateArg, expected);

      sinon.assert.calledOnce(updateSpy);
      updateSpy.restore();

    });

  });

});