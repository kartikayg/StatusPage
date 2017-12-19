/**
 * TESTING REPO - the idea is to test that the right params are being 
 * passed to the db dao's and whatever comes back from dao is being returned back.
 *
 * Note: There is no real db operations happening.
 */

import {assert} from 'chai';
import sinon from 'sinon';

import omit from 'lodash/fp/omit';

import subscriptionRepo from './subscription';

describe('repo/subscriptions', function() {

  /**
   * MOCK VARIABLES
   */

  const staticCurrentTime = new Date();

  const testEmailSubscriptionId = 'SB123';
  const newEmailSubscriptionObj = {
    type: 'email',
    email: 'valid@gmail.com',
    components: ['cid_1']
  };
  const existingEmailSubscriptionObj = Object.assign({}, newEmailSubscriptionObj, {
    _id: '_id',
    id: testEmailSubscriptionId,
    created_at: staticCurrentTime,
    updated_at: staticCurrentTime,
    is_confirmed: false
  });
  const existingEmailSubscriptionObjWithoutId = omit(['_id'])(existingEmailSubscriptionObj);


  const testWebhookSubscriptionId = 'SB456';
  const newWebhookSubscriptionObj = {
    type: 'webhook',
    uri: 'http://www.uri.com/endpoint',
    components: ['cid_1', 'cid_2']
  };
  const existingWebhookSubscriptionObj = Object.assign({}, newWebhookSubscriptionObj, {
    _id: '_id',
    id: testWebhookSubscriptionId,
    created_at: staticCurrentTime,
    updated_at: staticCurrentTime,
    is_confirmed: false
  });
  const existingWebhookSubscriptionObjWithoutId = omit(['_id'])(existingWebhookSubscriptionObj);


  const daoMockObj = {
    
    name: 'subscriptions',

    find (pred, sortBy = {}) {
      if (pred.id == testEmailSubscriptionId || pred.type == 'email') return Promise.resolve([existingEmailSubscriptionObj]);
      if (pred.id == testWebhookSubscriptionId || pred.type == 'webhook') return Promise.resolve([existingWebhookSubscriptionObj]);

      if (Object.keys(pred).length === 0) return Promise.resolve([existingEmailSubscriptionObj, existingWebhookSubscriptionObj]);

      return Promise.resolve([]);
    }

  };

  const repo = subscriptionRepo.init(daoMockObj);

  /**
   * TEST CASES
   */

  it ('should throw error if invalid dao passed', function(done) {

    try {
      subscriptionRepo.init({name: 'bogus'}, {});
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
      const subscriptions = await repo.list();

      sinon.assert.calledOnce(findSpy);
      sinon.assert.calledWith(findSpy, {}, sortBy);

      assert.deepEqual(subscriptions, [existingEmailSubscriptionObjWithoutId, existingWebhookSubscriptionObjWithoutId]);

      findSpy.restore();

    });

    it ('should return components with type + multiple filters', async function() {

      const findSpy = sinon.spy(daoMockObj, 'find');

      //  filters
      let pred = { type: 'email', is_confirmed: 'true' };
      
      const subscriptions = await repo.list(pred);

      const expectedPred = { type: 'email', is_confirmed: true };

      sinon.assert.calledOnce(findSpy);
      sinon.assert.calledWith(findSpy, expectedPred, sortBy);
      assert.deepEqual(subscriptions, [existingEmailSubscriptionObjWithoutId]);

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


    it ('should return no subscriptions with filters', async function() {

      const findSpy = sinon.spy(daoMockObj, 'find');

      // pred
      let pred = { type: 'type' };
      
      const subscriptions = await repo.list(pred);

      sinon.assert.calledOnce(findSpy);
      sinon.assert.calledWith(findSpy, pred, sortBy);
      assert.deepEqual(subscriptions, []);

      findSpy.restore();

    });

    it ('should return subscriptions even if extra filters passed', async function() {

      const findSpy = sinon.spy(daoMockObj, 'find');

      let pred = { type: 'email', extra: 'test' };
      
      const subscriptions = await repo.list(pred);

      const expectedPred = { type: 'email' };

      sinon.assert.calledOnce(findSpy);
      sinon.assert.calledWith(findSpy, expectedPred, sortBy);
      assert.deepEqual(subscriptions, [existingEmailSubscriptionObjWithoutId]);

      findSpy.restore();

    });

  });

  describe('load()', function() {

    it ('should load a subscription given a valid id', async function() {

      const findSpy = sinon.spy(daoMockObj, 'find');

      const obj = await repo.load(testEmailSubscriptionId);

      // its calling dao find
      // its calling with the right pred
      // returning the stuff from dao.
      sinon.assert.calledOnce(findSpy);
      sinon.assert.calledWith(findSpy, { id: testEmailSubscriptionId });
      assert.deepEqual(obj, existingEmailSubscriptionObjWithoutId);

      findSpy.restore();

    });

    it ('should error when no subscription is found', function(done) {

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
        assert.strictEqual(e.name, 'InvalidSubscriptionTypeError');
        done();
      });
    });

    it ('should return the repo for different subscription types', async function () {

      await subscriptionRepo.validTypes.forEach(async (t) => {
        const r = await repo.ofType(t);
        assert.strictEqual(r.type, t);
      });

    });

  });

});;