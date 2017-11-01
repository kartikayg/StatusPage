import {assert} from 'chai';
import sinon from 'sinon';

import * as mongo from './mongo';

describe('lib/db/mongo', function() {

  let testCollectionDb = {
    
    createIndex(field, options) {},

    count(pred, callback) {
      if (pred.id == 123) callback(null, 1);
      else callback(new Error('error'));
    },

    insert(data, callback) {
      if (data.id) callback(null, {ops: [data]});
      else callback(new Error('error'));
    },

    update(pred, data, options, callback) {
      if (data.id) callback(null, {result: {nModified: 1}});
      else callback(new Error('error'));
    },

    deleteMany(pred, callback) {
      if (pred.id) callback(null, {deletedCount: 1});
      else callback(new Error('error'));
    }

  };

  let testDb = {
    createCollection(name, options) {
      return Promise.resolve();
    },
    collection(name) {
      return testCollectionDb;
    }
  };

  describe('connect', function() {

    it('should return a db connection', async function() {

      const db = await mongo.connect({
        MONGO_ENDPOINT: 'mongodb://db/componentservice'
      });

      assert.isObject(db);
      assert.equal(db.databaseName, 'componentservice');

      db.close();

    });

    it('should throw Error exception if invalid mongo connection string', function(done) {
      
      mongo.connect({MONGO_ENDPOINT: 'invalid_url'})
        .catch(e => {
          assert.equal(e.name, 'Error');
          done();
        });

    });

    it('should throw MongoError exception if invalid mongo connection string', function(done) {
      
      mongo.connect({MONGO_ENDPOINT: 'mongodb://invalid/123'})
        .catch(e => {
          assert.equal(e.name, 'MongoError');
          done();
        });

    });

  });


  describe('initial setup', function() {

    it('should setup the tables with indexes', async function() {

      const createSpy = sinon.spy(testDb, 'createCollection');
      const idxSpy = sinon.spy(testCollectionDb, 'createIndex');

      await mongo.initialSetup(testDb);

      // setup two tables
      sinon.assert.calledTwice(createSpy);
      sinon.assert.calledWith(createSpy, 'components');
      sinon.assert.calledWith(createSpy, 'componentgroups');

      // setup indexes
      sinon.assert.calledTwice(idxSpy);

      createSpy.restore();
      idxSpy.restore();

    });

  });

  describe('dao', function() {

    let dao = mongo.getDao(testDb, 'components');

    describe('count', function() {

      const countSpy = sinon.spy(testCollectionDb, 'count');

      beforeEach(function() {
        countSpy.reset();
      });

      after(function() {
        countSpy.restore();
      });

      it('should return the count from db collection', async function() {

        // get count
        const pred = {id: 123};
        const count = await dao.count(pred);
        
        assert.strictEqual(count, 1);
        sinon.assert.calledOnce(countSpy);
        sinon.assert.calledWith(countSpy, pred);

      });

      it('should return error', function(done) {

        dao.count({}).catch(e => {
          assert.strictEqual(e.message, 'error');
          sinon.assert.calledWith(countSpy, {});
          done();
        });

      });

    });

    describe('insert', function() {

      const insertSpy = sinon.spy(testCollectionDb, 'insert');

      beforeEach(function() {
        insertSpy.reset();
      });

      after(function() {
        insertSpy.restore();
      });

      it ('should return from the db collection', async function() {

        // do insert
        const data = {id: 'test', name: 'test'};
        const res = await dao.insert(data);
        
        assert.deepEqual(res, data);
        sinon.assert.calledOnce(insertSpy);
        sinon.assert.calledWith(insertSpy, data);

      });

      it ('should return the error', function(done) {
        dao.insert().catch(e => {
          assert.strictEqual(e.message, 'error');
          sinon.assert.calledOnce(insertSpy);
          done();
        });
      })

    });

    describe('update', function() {

      const updateSpy = sinon.spy(testCollectionDb, 'update');

      beforeEach(function() {
        updateSpy.reset();
      });

      after(function() {
        updateSpy.restore();
      });

      if ('should return the updated count from db collection', async function() {

        // do update
        const data = {id: 'test', name: 'test'};
        const pred = {id: 'test'};
        const res = await dao.update(data, pred);

        assert.strictEqual(res, 1);
        sinon.assert.calledOnce(updateSpy);
        sinon.assert.calledWith(updateSpy, pred, data);

      });

      it ('should return the error', function(done) {
        dao.update().catch(e => {
          assert.strictEqual(e.message, 'error');
          sinon.assert.calledOnce(updateSpy);
          done();
        });
      });

    });

    describe('remove', function() {

      const removeSpy = sinon.spy(testCollectionDb, 'deleteMany');

      beforeEach(function() {
        removeSpy.reset();
      });

      after(function() {
        removeSpy.restore();
      });

      it ('should return the count after delete', async function() {

        // do remove
        const pred = {id: 1};
        const cnt = await dao.remove(pred);

        assert.strictEqual(cnt, 1);
        sinon.assert.calledOnce(removeSpy);
        sinon.assert.calledWith(removeSpy, pred);

      });

      it ('should return the error from db collection', function(done) {
        dao.remove().catch(e => {
          assert.strictEqual(e.message, 'error');
          sinon.assert.calledOnce(removeSpy);
          done();
        });
      });

    });

  });

});