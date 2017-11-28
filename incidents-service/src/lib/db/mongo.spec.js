import {assert} from 'chai';
import sinon from 'sinon';
import mockery from 'mockery';

describe('lib/db/mongo', function() {

  // collection object, stub for the db collection
  const testCollection = {
    
    createIndex(field, options) {},

    count(pred, callback) {
      return callback(null, 1);
    },

    find(pred) {

      const data = [{ name: 'kartik' }];

      return {
        sort(sort) {
          return {
            toArray(callback) {
              callback(null, data);
            }
          }
        } 
      }
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

  // db object, stub for mongodb
  const testDb = {
    createCollection(name, options) {
      return Promise.resolve();
    },
    collection(name) {
      return testCollection;
    }
  };

  const validEndpoint = 'mongodb://db/componentservice';

  // mocking the mongoclient library. instead of doing an actual connection
  // this returns the testDb
  const MongoClientMock = {
    connect(endpoint, options, callback) {
      if (endpoint == validEndpoint) {
        callback(null, testDb);
      }
      else {
        callback(new Error('invalid db'));
      }
    }
  };

  let initDb;

  before(function() {

     // setup mockery
    mockery.enable({ warnOnUnregistered: false });
    mockery.registerMock('mongodb', MongoClientMock);

    // loading module here so that the mockery is all setup. if loading before,
    // then mocking amqp won't work.

    delete require.cache[require.resolve('./mongo')];
    initDb = require('./mongo').init;

  });

  // mockery done
  after(function () {
    mockery.deregisterMock('mongodb');
    mockery.disable();
    delete require.cache[require.resolve('./mongo')];
  });

  describe ('connect', function () {

    it ('should return a db object for a valid mongo db endpoint', async function () {
      const db = await initDb(validEndpoint);

      assert.isFunction(db.setup);
      assert.isFunction(db.dao);

      assert.isObject(db);
    });

    it ('should throw exception if invalid mongo connection string', function (done) {

      initDb('invalid').catch(e => {
        assert.equal(e.message, 'invalid db');
        done();
      });

    });

  });


  describe ('initial setup', function () {

    it ('should setup the tables with indexes', async function () {

      const createSpy = sinon.spy(testDb, 'createCollection');
      const idxSpy = sinon.spy(testCollection, 'createIndex');

      const db = await initDb(validEndpoint);
      await db.setup();      

      // setup two tables
      sinon.assert.calledTwice(createSpy);
      sinon.assert.calledWith(createSpy, 'components');
      sinon.assert.calledWith(createSpy, 'component_groups');

      // setup indexes
      sinon.assert.calledTwice(idxSpy);

      createSpy.restore();
      idxSpy.restore();

    });

  });

  describe ('dao testing, using the mongo db collection', function () {

    let db;
    let dao;

    before (async function () {
      db = await initDb(validEndpoint);
      dao = db.dao('components');
    });

    describe ('count', function () {

      const countSpy = sinon.spy(testCollection, 'count');

      beforeEach(function() {
        countSpy.reset();
      });

      after(function() {
        countSpy.restore();
      });

      it('should return the count with a predicate', async function () {

        // get count
        const pred = {id: 123};
        const count = await dao.count(pred);
        
        assert.strictEqual(count, 1);
        sinon.assert.calledOnce(countSpy);
        sinon.assert.calledWith(countSpy, pred);

      });

      it('should return the count with no predicate', async function() {

        // get count
        const pred = {};
        const count = await dao.count(pred);
        
        assert.strictEqual(count, 1);
        sinon.assert.calledOnce(countSpy);
        sinon.assert.calledWith(countSpy, pred);

      });

      it('should return error from db collection', function(done) {

        // force error
        countSpy.restore();
        const countStub = sinon.stub(testCollection, 'count').callsFake((pred, callback) => {
          callback(new Error('error'));
        });

        dao.count().catch(e => {
          assert.strictEqual(e.message, 'error');
          sinon.assert.calledOnce(countStub);
          countStub.restore();
          done();
        });

      });

    });

    describe('find', function() {

      const findSpy = sinon.spy(testCollection, 'find');

      beforeEach(function() {
        findSpy.reset();
      });

      after(function() {
        findSpy.restore();
      });

      it ('should return results with predicate', async function() {

        const pred = {name: 'me'};
        const sort = {age: -1}

        const res = await dao.find(pred, sort);

        assert.deepEqual(res, [{ name: 'kartik' }]);
        sinon.assert.calledOnce(findSpy);
        sinon.assert.calledWith(findSpy, pred);

      });

      it ('should return results with no predicate', async function() {

        const pred = {};
        const sort = {}

        const res = await dao.find(pred, sort);

        assert.deepEqual(res, [{ name: 'kartik' }]);
        sinon.assert.calledOnce(findSpy);
        sinon.assert.calledWith(findSpy, pred);

      });

    });

    describe('insert', function() {

      const insertSpy = sinon.spy(testCollection, 'insert');

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
      });

    });

    describe('update', function() {

      const updateSpy = sinon.spy(testCollection, 'update');

      beforeEach(function() {
        updateSpy.reset();
      });

      after(function() {
        updateSpy.restore();
      });

      it ('should return the updated count from db collection', async function() {

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

      const removeSpy = sinon.spy(testCollection, 'deleteMany');

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