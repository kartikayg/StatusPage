import {assert} from 'chai';
import sinon from 'sinon';

import componentGroupRepo from './component-group';
import {componentGroup as componentGroupEntity} from '../entities/index';

describe('repo/component_groups', function() {

  const testCmpGrpId = 'test123';

  const newCmpGroup = {
    name: 'widget',
    sort_order: 2,
    status: 'partial_outage',
    active: true
  };

  const existingCmpGroup = Object.assign({
    id: testCmpGrpId,
    _id: '_id',
    created_at: 'time',
    updated_at: 'time',
    active: true
  }, newCmpGroup);

  const existingCmpGroupWithoutId = Object.assign({}, existingCmpGroup);
  delete existingCmpGroupWithoutId._id;


  const testDao = {
    name: 'component_groups',

    count(pred) {
      if (pred.id == testCmpGrpId) return Promise.resolve(1)
      else return Promise.resolve(0);
    },

    find (pred, sortBy = {}) {
      if (pred.id == testCmpGrpId || pred.active == true) return Promise.resolve([existingCmpGroup]);
      else return Promise.resolve([]);
    },

    insert(data) {
      return Promise.resolve(existingCmpGroup);
    },

    update(data) {
      return Promise.resolve(data);
    },

    remove(pred) {
      if (pred.id == testCmpGrpId)  return Promise.resolve(1);
      else return Promise.resolve(0);
    }

  };

  const repo = componentGroupRepo.init(testDao);

  it ('should throw error if an invalid dao passed', function(done) {

    try {
      componentGroupRepo.init({ name: 'bogus' });
    }
    catch (e) {
      assert.strictEqual(e.message, 'Invalid DAO passed to this repo. Passed dao name: bogus.');
      done();
    }

  });

  describe('doesIdExists()', function() {

    it ('should return true if group exists', async function() {

      const countSpy = sinon.spy(testDao, 'count');

      const exists = await repo.doesIdExists(testCmpGrpId);

      sinon.assert.calledOnce(countSpy);
      sinon.assert.calledWith(countSpy, {id: testCmpGrpId});
      assert.strictEqual(exists, true);

      countSpy.restore();

    });

    it ('should return false if group doesn\'t exists', async function() {

      const countSpy = sinon.spy(testDao, 'count');

      const exists = await repo.doesIdExists('invalid');

      sinon.assert.calledOnce(countSpy);
      assert.strictEqual(exists, false);

      countSpy.restore();

    });

    it ('should reject error if there is an db error', function(done) {

      const countStub = sinon.stub(testDao, 'count').callsFake(id => {
        throw new Error('db error');
      });

      repo.doesIdExists(testCmpGrpId).catch(e => {

        sinon.assert.calledOnce(countStub);
        assert.strictEqual(e.message, 'db error');

        countStub.restore();
        done();
      });

    });

  });


  describe('load()', function() {

    it ('should load a component group given a valid id', async function() {

      const findSpy = sinon.spy(testDao, 'find');

      const componentGroup = await repo.load(testCmpGrpId);

      // its calling dao find
      // its calling with the right pred
      // returning the stuff from dao.
      sinon.assert.calledOnce(findSpy);
      sinon.assert.calledWith(findSpy, { id: testCmpGrpId });
      assert.deepEqual(componentGroup, existingCmpGroupWithoutId);

      findSpy.restore();

    });

    it ('should error when no component group is found', function(done) {

      const findSpy = sinon.spy(testDao, 'find');

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

  describe('list()', function() {

    it ('should return component groups with one filter', async function() {

      const findSpy = sinon.spy(testDao, 'find');

      const sortBy = { sort_order: 1, _id: 1 };

      // one filter
      let pred = { active: true };
      const groups = await repo.list(pred);

      sinon.assert.calledOnce(findSpy);
      sinon.assert.calledWith(findSpy, pred, sortBy);
      assert.deepEqual(groups, [existingCmpGroupWithoutId]);

      findSpy.restore();

    });

    it ('should return component groups with multiple filters', async function() {

      const findSpy = sinon.spy(testDao, 'find');

      const sortBy = { sort_order: 1, _id: 1 };

      // one filter
      let pred = { active: true, status: 'good' };
      const groups = await repo.list(pred);

      sinon.assert.calledOnce(findSpy);
      sinon.assert.calledWith(findSpy, pred, sortBy);
      assert.deepEqual(groups, [existingCmpGroupWithoutId]);

      findSpy.restore();

    });

    it ('should return component groups with extra filters but no error', async function() {

      const findSpy = sinon.spy(testDao, 'find');

      const sortBy = { sort_order: 1, _id: 1 };

      // one filter
      let pred = { active: true, filter: 'test' };
      const groups = await repo.list(pred);

      sinon.assert.calledOnce(findSpy);
      sinon.assert.calledWith(findSpy, {active: true}, sortBy);
      assert.deepEqual(groups, [existingCmpGroupWithoutId]);

      findSpy.restore();

    });

    it ('should return no component groups with filters', async function() {

      const findSpy = sinon.spy(testDao, 'find');

      const sortBy = { sort_order: 1, _id: 1 };

      // one filter
      let pred = { active: false, status: 'operational'};
      const groups = await repo.list(pred);

      sinon.assert.calledOnce(findSpy);
      sinon.assert.calledWith(findSpy, pred, sortBy);
      assert.deepEqual(groups, []);

      findSpy.restore();

    });

    it ('should return an error on find()', function(done) {

      const findStub = sinon.stub(testDao, 'find').callsFake((pred, sortBy) => {
        throw new Error('db error');
      });

      const sortBy = { sort_order: 1, _id: 1 };
      const pred = { active: false, status: 'operational'};
      
      repo.list(pred).catch(e => {

        assert.strictEqual(e.message, 'db error');
        sinon.assert.calledOnce(findStub);
        sinon.assert.calledWith(findStub, pred, sortBy);

        findStub.restore();
        done();
      });

    });

  });


  describe('create()', function() {

    it ('should validate and create a component group', async function() {

      const insertSpy = sinon.spy(testDao, 'insert');
      const genIdStub = sinon.stub(componentGroupEntity, 'generateId').callsFake(() => {
        return testCmpGrpId;
      });

      const group = await repo.create(newCmpGroup);

      // call the dao insert 
      sinon.assert.calledOnce(insertSpy);

      // dao called with right params
      const insertArg = insertSpy.args[0][0];
      const insertExpected = Object.assign({id: testCmpGrpId, created_at: insertArg.created_at, updated_at: insertArg.updated_at}, newCmpGroup)
      assert.deepEqual(insertExpected, insertArg);

      // check id generation
      sinon.assert.calledOnce(genIdStub);


      // returning the res from dao insert
      assert.deepEqual(group, existingCmpGroupWithoutId);

      insertSpy.restore();
      genIdStub.restore();

    });


    it ('should fail b/c of validation', function(done) {

      repo.create({}).catch(e => {
        assert.strictEqual(e.name, 'ValidationError');
        done();
      });

    });

  });

  describe('update', function() {

    it ('should update a component group with new data', async function() {

      const updateSpy = sinon.spy(testDao, 'update');

      const updated = {
        name: 'updated name',
        sort_order: 1,
        status: 'operational',
        description: 'desc'
      };

      await repo.update(testCmpGrpId, updated);

      // dao called using the new data
      const updateArg = updateSpy.args[0][0];
      const updateExpected = Object.assign({}, existingCmpGroupWithoutId, updated, {updated_at: updateArg.updated_at});
      assert.deepEqual(updateExpected, updateArg);

      // calling update dao
      sinon.assert.calledOnce(updateSpy);

      updateSpy.restore();

    });

    it ('should fail b/c of validation', function(done) {

      repo.update(testCmpGrpId, {}).catch(e => {
        assert.strictEqual(e.name, 'ValidationError');
        done();
      });

    });

    it ('should fail b/c of invalid group id', function(done) {

      repo.update('123', {}).catch(e => {
        assert.strictEqual(e.name, 'IdNotFoundError');
        done();
      });

    });

  });

  describe('partialUpdate()', function() {

    it ('should partially update a component group', async function() {

      const repoUpdateStub = sinon.stub(repo, 'update');

      const updated = {
        name: 'partial updated name'
      };

      const res = await repo.partialUpdate(testCmpGrpId, updated);

      // calling update on repo
      sinon.assert.calledOnce(repoUpdateStub);
      sinon.assert.calledWith(repoUpdateStub, testCmpGrpId, {
        name: 'partial updated name',
        sort_order: 2,
        status: 'partial_outage',
        active: true
      });

      repoUpdateStub.restore();

    });

  });


  describe('remove()', function() {

    it ('should remove a component group', async function() {

      const removeSpy = sinon.spy(testDao, 'remove');

      await repo.remove(testCmpGrpId);

      // its calling dao remove
      // its calling with the right pred
      sinon.assert.calledOnce(removeSpy);
      sinon.assert.calledWith(removeSpy, { id: testCmpGrpId });

      removeSpy.restore();

    });

    it ('should fail b/c of invalid id', function(done) {

      const removeSpy = sinon.spy(testDao, 'remove');

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


});
