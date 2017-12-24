/**
 * TESTING REPO - the idea is to test that the right params are being 
 * passed to the db dao's and whatever comes back from dao is being returned back.
 *
 * Note: There is no real db operations that happen.
 */

import {assert} from 'chai';
import sinon from 'sinon';
import MockDate from 'mockdate';

import _omit from 'lodash/fp/omit';

import component from './component';
import {component as componentEntity} from '../entities/index';

describe('repo/component', function() {

  /**
   * MOCK VARIABLES
   */

  const staticCurrentTime = new Date();

  const testCmpId = 'CM123';

  const newCmp = {
    name: 'widget',
    sort_order: 2,
    status: 'partial_outage',
    active: true
  };

  const existingCmp = Object.assign({
    id: testCmpId,
    _id: '_id',
    created_at: staticCurrentTime,
    updated_at: staticCurrentTime,
    description: null,
    group_id: null,
    active: true
  }, newCmp);

  const existingCmpWithoutId = _omit(['_id'])(existingCmp);

  const daoMockObj = {
    
    name: 'components',

    find (pred, sortBy = {}) {
      if (pred.id == testCmpId || pred.active == true) return Promise.resolve([existingCmp]);
      else return Promise.resolve([]);
    },

    insert(data) {
      return Promise.resolve(existingCmp);
    },

    update(data) {
      return Promise.resolve(data);
    },

    remove(pred) {
      if (pred.id == testCmpId)  return Promise.resolve(1);
      else return Promise.resolve(0);
    }

  };

  const testComponentGroupRepoStub = {
    doesIdExists(id) {
      return Promise.resolve(true);
    }
  };

  const repo = component.init(daoMockObj, testComponentGroupRepoStub);


  before(function () {
    MockDate.set(staticCurrentTime);
  });

  after(function () {
    MockDate.reset();
  });

  /**
   * TEST CASES
   */

  it ('should throw error if invalid dao passed', function(done) {

    try {
      component.init({name: 'bogus'}, {});
    }
    catch (e) {
      assert.strictEqual(e.message, 'Invalid DAO passed to this repo. Passed dao name: bogus');
      done();
    }

  });

  describe('list()', function() {

    it ('should return components with one filter', async function() {

      const findSpy = sinon.spy(daoMockObj, 'find');

      const sortBy = { group_id: 1, sort_order: 1, _id: 1 };

      // one filter
      let pred = { active: true };
      const components = await repo.list(pred);

      sinon.assert.calledOnce(findSpy);
      sinon.assert.calledWith(findSpy, pred, sortBy);
      assert.deepEqual(components, [existingCmpWithoutId]);

      findSpy.restore();

    });

    it ('should return components with multiple filters', async function() {

      const findSpy = sinon.spy(daoMockObj, 'find');

      const sortBy = { group_id: 1, sort_order: 1, _id: 1 };

      // one filter
      let pred = { active: true, group_id: 'test' };
      const components = await repo.list(pred);

      sinon.assert.calledOnce(findSpy);
      sinon.assert.calledWith(findSpy, pred, sortBy);
      assert.deepEqual(components, [existingCmpWithoutId]);

      findSpy.restore();

    });

    it ('should return components  with extra filters but no error', async function() {

      const findSpy = sinon.spy(daoMockObj, 'find');

      const sortBy = { group_id: 1, sort_order: 1, _id: 1 };

      // one filter
      let pred = { active: true, filter: 'test' };
      const components = await repo.list(pred);

      sinon.assert.calledOnce(findSpy);
      sinon.assert.calledWith(findSpy, {active: true}, sortBy);
      assert.deepEqual(components, [existingCmpWithoutId]);

      findSpy.restore();

    });

    it ('should return no components with filters', async function() {

      const findSpy = sinon.spy(daoMockObj, 'find');

      const sortBy = { group_id: 1, sort_order: 1, _id: 1 };

      // one filter
      let pred = { active: false, group_id: 'group', status: 'operational'};
      const components = await repo.list(pred);

      sinon.assert.calledOnce(findSpy);
      sinon.assert.calledWith(findSpy, pred, sortBy);
      assert.deepEqual(components, []);

      findSpy.restore();

    });

    it ('should return an error on find()', function(done) {

      const findStub = sinon.stub(daoMockObj, 'find').callsFake((pred, sortBy) => {
        throw new Error('db error');
      });

      const sortBy = { group_id: 1, sort_order: 1, _id: 1 };
      const pred = { active: false, group_id: 'group', status: 'operational'};
      
      repo.list(pred).catch(e => {

        assert.strictEqual(e.message, 'db error');
        sinon.assert.calledOnce(findStub);
        sinon.assert.calledWith(findStub, pred, sortBy);

        findStub.restore();
        done();
      });

    });

  });

  describe('load()', function() {

    it ('should load a component given a valid id', async function() {

      const findSpy = sinon.spy(daoMockObj, 'find');

      const component = await repo.load(testCmpId);

      // its calling dao find
      // its calling with the right pred
      // returning the stuff from dao.
      sinon.assert.calledOnce(findSpy);
      sinon.assert.calledWith(findSpy, { id: testCmpId });
      assert.deepEqual(component, existingCmpWithoutId);

      findSpy.restore();

    });

    it ('should error when no component is found', function(done) {

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

  describe('create()', function() {

    it ('should validate and create a component', async function() {

      const insertSpy = sinon.spy(daoMockObj, 'insert');
      const genIdStub = sinon.stub(componentEntity, 'generateId').callsFake(() => {
        return testCmpId;
      });

      const componentObj = await repo.create(newCmp);

      // call the dao insert 
      sinon.assert.calledOnce(insertSpy);

      // dao called with right params
      const insertArg = insertSpy.args[0][0];
      const insertExpected = Object.assign({}, newCmp, {
        id: testCmpId,
        created_at: staticCurrentTime,
        updated_at: staticCurrentTime,
        description: null,
        group_id: null
      });

      assert.deepEqual(insertExpected, insertArg);

      // check id generation
      sinon.assert.calledOnce(genIdStub);


      // returning the res from dao insert
      assert.deepEqual(componentObj, existingCmpWithoutId);

      insertSpy.restore();
      genIdStub.restore();

    });

    it ('should create a component with group_id', async function() {

      const groupExistsSpy = sinon.spy(testComponentGroupRepoStub, 'doesIdExists');
      const insertSpy = sinon.spy(daoMockObj, 'insert');

      const cmpWithId = Object.assign({group_id: 'CG123'}, newCmp);
      const component = await repo.create(cmpWithId);

      // group exists fn ..
      sinon.assert.calledOnce(groupExistsSpy);
      sinon.assert.calledWith(groupExistsSpy, 'CG123');

      
      // insert fn, right group_id passed ..
      const insertArg = insertSpy.args[0][0];
      assert.strictEqual('CG123', insertArg.group_id);
      
      groupExistsSpy.restore();
      insertSpy.restore();

    });

    it ('should fail b/c of validation', function(done) {

      repo.create({}).catch(e => {
        assert.strictEqual(e.name, 'ValidationError');
        done();
      });

    });

    it ('should fail b/c of a non-existant group id', function(done) {

      // return false
      const groupExistsStub = sinon.stub(testComponentGroupRepoStub, 'doesIdExists').callsFake((id) => {
        return Promise.resolve(false);
      });

      const cmpWithId = Object.assign({ group_id: 'CG123'}, newCmp);
      repo.create(cmpWithId).catch(e => {
        sinon.assert.calledOnce(groupExistsStub);  
        assert.strictEqual(e.name, 'IdNotFoundError');
        
        groupExistsStub.restore();
        done();
      });

    });

  });

  describe('update', function() {

    it ('should update a component with new data', async function() {

      const updateSpy = sinon.spy(daoMockObj, 'update');

      const updated = {
        name: 'updated name',
        sort_order: 1,
        status: 'operational',
        description: 'desc'
      };

      await repo.update(existingCmpWithoutId, updated);

      // dao called using the new data
      const updateArg = updateSpy.args[0][0];
      const updateExpected = Object.assign({group_id: null}, existingCmpWithoutId, updated, {updated_at: staticCurrentTime});
      assert.deepEqual(updateExpected, updateArg);

      // calling update dao
      sinon.assert.calledOnce(updateSpy);

      updateSpy.restore();

    });

  });

  describe('remove()', function() {

    it ('should remove a component', async function() {

      const removeSpy = sinon.spy(daoMockObj, 'remove');

      await repo.remove(existingCmpWithoutId);

      // its calling dao remove
      // its calling with the right pred
      sinon.assert.calledOnce(removeSpy);
      sinon.assert.calledWith(removeSpy, { id: testCmpId });

      removeSpy.restore();

    });

    it ('should fail b/c of invalid id', function(done) {

      const removeSpy = sinon.spy(daoMockObj, 'remove');

      repo.remove({}).catch(e => {
      
        // its calling dao remove
        // returning the error  
        sinon.assert.calledOnce(removeSpy);
        assert.strictEqual(e.name, 'IdNotFoundError');

        removeSpy.restore();

        done();

      });    

    });

  });

});