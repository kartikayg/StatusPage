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
      if (data.id) callback(null, data);
      else callback(new Error('error'));
    },

    update(pred, data, callback) {
      if (data.id) callback(null, data);
      else callback(new Error('error'));
    },

    deleteMany(pred, callback) {
      if (pred.id) callback(null, {deletedCount: 2});
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

    it('count', async function() {

      const countSpy = sinon.spy(testCollectionDb, 'count');

      // get count
      const count = await dao.count({id: 123});
      assert.strictEqual(count, 1);

      // error check
      let isError = false;
      try {
        await dao.count({});
      }
      catch (e) {
        assert.strictEqual(e.message, 'error');
        isError = true;
      }

      assert.isTrue(isError);

      sinon.assert.calledTwice(countSpy);

      countSpy.restore();

    });

    it('insert', async function() {

      const insertSpy = sinon.spy(testCollectionDb, 'insert');

      // do insert
      const data = {id: 'test', name: 'test'};
      const res = await dao.insert(data);
      assert.deepEqual(res, data);

      // error check
      let isError = false;
      try {
        await dao.insert();
      }
      catch (e) {
        assert.strictEqual(e.message, 'error');
        isError = true;
      }

      assert.isTrue(isError);

      sinon.assert.calledTwice(insertSpy);

      insertSpy.restore();

    });

    it('update', async function() {

      const updateSpy = sinon.spy(testCollectionDb, 'update');

      // do update
      const data = {id: 'test', name: 'test'};
      const res = await dao.update(data, {id: 'test'});

      assert.deepEqual(res, data);

      // error check
      let isError = false;
      try {
        await dao.update();
      }
      catch (e) {
        assert.strictEqual(e.message, 'error');
        isError = true;
      }

      assert.isTrue(isError);

      sinon.assert.calledTwice(updateSpy);

      updateSpy.restore();

    });

    it('remove', async function() {

      const removeSpy = sinon.spy(testCollectionDb, 'deleteMany');

      // do remove
      const cnt = await dao.remove({id: 1});
      assert.strictEqual(cnt, 2);

      // error check
      let isError = false;
      try {
        await dao.remove();
      }
      catch (e) {
        assert.strictEqual(e.message, 'error');
        isError = true;
      }

      assert.isTrue(isError);

      sinon.assert.calledTwice(removeSpy);

      removeSpy.restore();

    });

  });

});