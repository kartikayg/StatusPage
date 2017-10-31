import {assert} from 'chai';
import sinon from 'sinon';

import component from './component';
import {component as componentEntity} from '../entities/index';

describe('repo/component', function() {

  /**
   * MOCK VARIABLES
   */

  const testCmpId = '123';

  const newCmp = {
    name: 'widget',
    sort_order: 2,
    status: 'partial_outage',
    active: true
  };

  const existingCmp = Object.assign({
    id: testCmpId,
    _id: '_id',
    created_at: 'time',
    updated_at: 'time',
    active: true
  }, newCmp);

  const testDao = {
    
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

  const testGroupRepo = {

  };

  const repo = component.init(testDao, testGroupRepo);


  /**
   * TEST CASES
   */

  it ('find with one filter', async function() {

    const findSpy = sinon.spy(testDao, 'find');

    const sortBy = { group_id: 1, sort_order: 1, _id: 1 };

    // one filter
    let pred = { active: true };
    const components = await repo.list(pred);

    sinon.assert.calledOnce(findSpy);
    sinon.assert.calledWith(findSpy, pred, sortBy);
    assert.deepEqual(components, [existingCmp]);

    findSpy.restore();

  });

  it ('find with multiple filters', async function() {

    const findSpy = sinon.spy(testDao, 'find');

    const sortBy = { group_id: 1, sort_order: 1, _id: 1 };

    // one filter
    let pred = { active: true, group_id: 'test' };
    const components = await repo.list(pred);

    sinon.assert.calledOnce(findSpy);
    sinon.assert.calledWith(findSpy, pred, sortBy);
    assert.deepEqual(components, [existingCmp]);

    findSpy.restore();

  });

  it ('find with extra filters but no error', async function() {

    const findSpy = sinon.spy(testDao, 'find');

    const sortBy = { group_id: 1, sort_order: 1, _id: 1 };

    // one filter
    let pred = { active: true, filter: 'test' };
    const components = await repo.list(pred);

    sinon.assert.calledOnce(findSpy);
    sinon.assert.calledWith(findSpy, {active: true}, sortBy);
    assert.deepEqual(components, [existingCmp]);

    findSpy.restore();

  });

  it ('find with no return values', async function() {

    const findSpy = sinon.spy(testDao, 'find');

    const sortBy = { group_id: 1, sort_order: 1, _id: 1 };

    // one filter
    let pred = { active: false, group_id: 'group', status: 'operational'};
    const components = await repo.list(pred);

    sinon.assert.calledOnce(findSpy);
    sinon.assert.calledWith(findSpy, pred, sortBy);
    assert.deepEqual(components, []);

    findSpy.restore();

  });


  it ('load', async function() {

    const findSpy = sinon.spy(testDao, 'find');

    const component = await repo.load(testCmpId);

    // its calling dao find
    // its calling with the right pred
    // returning the stuff from dao.
    sinon.assert.calledOnce(findSpy);
    sinon.assert.calledWith(findSpy, { id: testCmpId });
    assert.deepEqual(component, existingCmp);

    findSpy.restore();

  });

  it ('load error when no component is found', function(done) {

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

  it ('create', async function() {

    const insertSpy = sinon.spy(testDao, 'insert');
    const genIdStub = sinon.stub(componentEntity, 'generateId').callsFake(() => {
      return testCmpId;
    });

    const component = await repo.create(newCmp);

    // call the dao insert 
    sinon.assert.calledOnce(insertSpy);

    // dao called with right params
    const insertArg = insertSpy.args[0][0];
    const insertExpected = Object.assign({id: testCmpId, created_at: insertArg.created_at, updated_at: insertArg.updated_at}, newCmp)
    assert.deepEqual(insertExpected, insertArg);

    // check id generation
    sinon.assert.calledOnce(genIdStub);


    // returning the res from dao insert
    assert.deepEqual(component, existingCmp);

    insertSpy.restore();
    genIdStub.restore();

  });

  it ('create error b/c of validation', function(done) {

    repo.create({}).catch(e => {
      assert.strictEqual(e.name, 'ValidationError');
      done();
    });

  });

  it ('update', async function() {

    const updateSpy = sinon.spy(testDao, 'update');

    const updated = {
      name: 'updated name',
      sort_order: 1,
      status: 'operational',
      description: 'desc'
    };

    await repo.update(testCmpId, updated);

    // dao called using the new data
    const updateArg = updateSpy.args[0][0];
    const updateExpected = Object.assign({}, existingCmp, updated, {updated_at: updateArg.updated_at});
    assert.deepEqual(updateExpected, updateArg);

    // calling update dao
    sinon.assert.calledOnce(updateSpy);

    updateSpy.restore();

  });

  it ('update error b/c of validation', function(done) {

    repo.update('123', {}).catch(e => {
      assert.strictEqual(e.name, 'ValidationError');
      done();
    });

  });

  it ('remove', async function() {

    const removeSpy = sinon.spy(testDao, 'remove');

    await repo.remove(testCmpId);

    // its calling dao remove
    // its calling with the right pred
    sinon.assert.calledOnce(removeSpy);
    sinon.assert.calledWith(removeSpy, { id: testCmpId });

    removeSpy.restore();

  });

  it ('remove error when no component is found', function(done) {

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