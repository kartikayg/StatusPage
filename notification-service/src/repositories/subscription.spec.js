// import {assert} from 'chai';
// import sinon from 'sinon';
// import MockDate from 'mockdate';

// import pick from 'lodash/fp/pick';
// import omit from 'lodash/fp/omit';
// import find from 'lodash/fp/find';
// import cloneDeep from 'lodash/fp/cloneDeep';

// import subscriptionRepo from './subscription';
// import { subscriber as subscriberEntity } from '../entities/index';

// describe('repo/subscriptions', function() {

//   /**
//    * MOCK VARIABLES
//    */

//   const staticCurrentTime = new Date();

//   const testEmailSubscriptionId = 'SB123';
//   const newEmailSubscriptionObj = {
//     type: 'email',
//     email: 'valid@gmail.com',
//     components: ['cid_1']
//   };
//   const existingEmailSubscriptionObj = Object.assign({}, newEmailSubscriptionObj, {
//     _id: '_id',
//     id: testEmailSubscriptionId,
//     created_at: staticCurrentTime,
//     updated_at: staticCurrentTime,
//     is_confirmed: false
//   });
//   const existingEmailSubscriptionObjWithoutId = omit(['_id'])(existingEmailSubscriptionObj);


//   const testWebhookSubscriptionId = 'SB456';
//   const newWebhookSubscriptionObj = {
//     type: 'webhook',
//     uri: 'http://www.uri.com/endpoint',
//     components: ['cid_1', 'cid_2']
//   };
//   const existingWebhookSubscriptionObj = Object.assign({}, newWebhookSubscriptionObj, {
//     _id: '_id',
//     id: testWebhookSubscriptionId,
//     created_at: staticCurrentTime,
//     updated_at: staticCurrentTime,
//     is_confirmed: false
//   });
//   const existingWebhookSubscriptionObjWithoutId = omit(['_id'])(existingWebhookSubscriptionObj);


//   const daoMockObj = {
    
//     name: 'subscriptions',

//     find (pred, sortBy = {}) {
//       if (pred.id == testEmailSubscriptionId || pred.type == 'email') return Promise.resolve([existingEmailSubscriptionObj]);
//       if (pred.id == testWebhookSubscriptionId || pred.type == 'webhook') return Promise.resolve([existingWebhookSubscriptionObj]);

//       if (Object.keys(pred).length === 0) return Promise.resolve([existingEmailSubscriptionObj, existingWebhookSubscriptionObj]);

//       return Promise.resolve([]);
//     },

//     insert(data) {
//       if (data.type == 'email') return Promise.resolve(existingEmailSubscriptionObj);
//     },

//     update(data) {
//       if (data.type == 'email') return Promise.resolve(existingEmailSubscriptionObj);
//     },

//     remove(pred) {
//       return Promise.resolve(pred.id == testEmailSubscriptionId ? 1 : 0);
//     }

//   };

//   const subTypeValidateSpy = sinon.spy();
//   const subTypeOnNewSubscriptionSpy = sinon.spy();

//   const subscriptionTypeMockObj = () => {
//     return {
//       validate: subTypeValidateSpy,
//       onNewSubscription: subTypeOnNewSubscriptionSpy
//     };
//   };

//   const repo = subscriptionRepo.init(daoMockObj, subscriptionTypeMockObj);


//   before(function () {
//     MockDate.set(staticCurrentTime);
//   });

//   after(function () {
//     MockDate.reset();
//   });

//   /**
//    * TEST CASES
//    */

//   it ('should throw error if invalid dao passed', function(done) {

//     try {
//       subscriptionRepo.init({name: 'bogus'}, {});
//     }
//     catch (e) {
//       assert.strictEqual(e.message, 'Invalid DAO passed to this repo. Passed dao name: bogus');
//       done();
//     }

//   });

//   describe('list()', function() {

//     const sortBy = { _id: 1 };

//     it ('should return components with no filter', async function () {

//       const findSpy = sinon.spy(daoMockObj, 'find');

//       // one filter
//       const subscriptions = await repo.list();

//       sinon.assert.calledOnce(findSpy);
//       sinon.assert.calledWith(findSpy, {}, sortBy);

//       assert.deepEqual(subscriptions, [existingEmailSubscriptionObjWithoutId, existingWebhookSubscriptionObjWithoutId]);

//       findSpy.restore();

//     });

//     it ('should return components with type + multiple filters', async function() {

//       const findSpy = sinon.spy(daoMockObj, 'find');

//       //  filters
//       let pred = { type: 'email', is_confirmed: 'true' };
      
//       const subscriptions = await repo.list(pred);

//       const expectedPred = { type: 'email', is_confirmed: true };

//       sinon.assert.calledOnce(findSpy);
//       sinon.assert.calledWith(findSpy, expectedPred, sortBy);
//       assert.deepEqual(subscriptions, [existingEmailSubscriptionObjWithoutId]);

//       findSpy.restore();

//     });

//     it ('should return an error on find() if db error', function(done) {

//       const findStub = sinon.stub(daoMockObj, 'find').callsFake((pred, sortBy) => {
//         throw new Error('db error');
//       });
      
//       repo.list().catch(e => {

//         assert.strictEqual(e.message, 'db error');
//         sinon.assert.calledOnce(findStub);

//         findStub.restore();
//         done();

//       });

//     });


//     it ('should return no subscriptions with filters', async function() {

//       const findSpy = sinon.spy(daoMockObj, 'find');

//       // pred
//       let pred = { type: 'type' };
      
//       const subscriptions = await repo.list(pred);

//       sinon.assert.calledOnce(findSpy);
//       sinon.assert.calledWith(findSpy, pred, sortBy);
//       assert.deepEqual(subscriptions, []);

//       findSpy.restore();

//     });

//     it ('should return subscriptions even if extra filters passed', async function() {

//       const findSpy = sinon.spy(daoMockObj, 'find');

//       let pred = { type: 'email', extra: 'test' };
      
//       const subscriptions = await repo.list(pred);

//       const expectedPred = { type: 'email' };

//       sinon.assert.calledOnce(findSpy);
//       sinon.assert.calledWith(findSpy, expectedPred, sortBy);
//       assert.deepEqual(subscriptions, [existingEmailSubscriptionObjWithoutId]);

//       findSpy.restore();

//     });

//   });

//   describe('load()', function() {

//     it ('should load a subscription given a valid id', async function() {

//       const findSpy = sinon.spy(daoMockObj, 'find');

//       const obj = await repo.load(testEmailSubscriptionId);

//       // its calling dao find
//       // its calling with the right pred
//       // returning the stuff from dao.
//       sinon.assert.calledOnce(findSpy);
//       sinon.assert.calledWith(findSpy, { id: testEmailSubscriptionId });
//       assert.deepEqual(obj, existingEmailSubscriptionObjWithoutId);

//       findSpy.restore();

//     });

//     it ('should error when no subscription is found', function(done) {

//       const findSpy = sinon.spy(daoMockObj, 'find');

//       repo.load('1').catch(e => {

//         // its calling dao find
//         // returning the error  
//         sinon.assert.calledOnce(findSpy);
//         assert.strictEqual(e.name, 'IdNotFoundError');

//         findSpy.restore();

//         done();

//       });    

//     });

//   });

//   describe('subscribe()', function () {

//     it ('should error for invalid type', function (done) {

//       repo.subscribe({
//         type: 'type'
//       }).catch(e => {
//         assert.strictEqual(e.name, 'InvalidSubscriptionTypeError');
//         done();
//       });

//     });

//     describe ('type#email', function () {

//       it ('should create a new email subscription', async function () {

//         const insertSpy = sinon.spy(daoMockObj, 'insert');
//         const genIncidentIdStub = sinon.stub(subscriberEntity, 'generateId').callsFake(() => {
//           return testEmailSubscriptionId;
//         });

//         subTypeValidateSpy.reset();
//         subTypeOnNewSubscriptionSpy.reset();

//         const obj = await repo.subscribe(newEmailSubscriptionObj);

//         assert.deepEqual(obj, existingEmailSubscriptionObjWithoutId);


//         // dao called with right params
//         const insertArg = insertSpy.args[0][0];
//         const expected = Object.assign({}, newEmailSubscriptionObj, {
//           id: testEmailSubscriptionId,
//           created_at: staticCurrentTime,
//           updated_at: staticCurrentTime,
//           is_confirmed: false, // by default, email sub is not confirmed
//         });
//         assert.deepEqual(insertArg, expected);

//         sinon.assert.calledOnce(insertSpy);
//         sinon.assert.calledOnce(genIncidentIdStub);
//         sinon.assert.calledOnce(subTypeValidateSpy);
//         sinon.assert.calledOnce(subTypeOnNewSubscriptionSpy);

//         genIncidentIdStub.restore();
//         insertSpy.restore();

//       });

//     });

//   });

//   describe('unsubscribe()', function () {

//     it ('should unsubscribe', async function() {

//       const removeSpy = sinon.spy(daoMockObj, 'remove');

//       await repo.unsubscribe(testEmailSubscriptionId);

//       // its calling dao remove
//       // its calling with the right pred
//       sinon.assert.calledOnce(removeSpy);
//       sinon.assert.calledWith(removeSpy, { id: testEmailSubscriptionId });

//       removeSpy.restore();

//     });

//     it ('should fail b/c of invalid id', function(done) {

//       const removeSpy = sinon.spy(daoMockObj, 'remove');

//       repo.unsubscribe('1').catch(e => {
      
//         // its calling dao remove
//         // returning the error  
//         sinon.assert.calledOnce(removeSpy);
//         assert.strictEqual(e.name, 'IdNotFoundError');

//         removeSpy.restore();

//         done();

//       });    

//     });

//   });

//   describe('confirmSubscription()', function () {

//     it ('should set the is_confirmed flag', async function () {

//       const updateSpy = sinon.spy(daoMockObj, 'update');

//       const obj = await repo.confirmSubscription(testEmailSubscriptionId);

//       // dao called with right params
//       const updateArg = updateSpy.args[0][0];
//       const expected = Object.assign({}, existingEmailSubscriptionObjWithoutId, {
//         is_confirmed: true
//       });
//       assert.deepEqual(updateArg, expected);

//       sinon.assert.calledOnce(updateSpy);

//       updateSpy.restore();

//     });

//   });

//   describe('manageComponents()', function () {

//     it ('should set the components as passed', async function () {

//       const updateSpy = sinon.spy(daoMockObj, 'update');

//       const obj = await repo.manageComponents(testEmailSubscriptionId, ['cid_1', 'cid_2']);

//       // dao called with right params
//       const updateArg = updateSpy.args[0][0];
//       const expected = Object.assign({}, existingEmailSubscriptionObjWithoutId, {
//         components: ['cid_1', 'cid_2']
//       });
//       assert.deepEqual(updateArg, expected);

//       sinon.assert.calledOnce(updateSpy);

//       updateSpy.restore();

//     });

//   });

// });;