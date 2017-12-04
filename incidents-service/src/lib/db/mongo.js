/**
 * @fileoverview MongoDb adapter to use in this microservice.
 */

import MongoClient from 'mongodb';

/**
* constants for Mongo DB connection. Currently, none of them exposed
* as env variables, but they can be later.
*/
const DB_PARAMS = {
  poolSize: 10,
  w: 'majority',
  wtimeout: 10000,
  j: true,
  readPreference: 'ReadPreference.SECONDARY_PREFERRED',
  autoReconnect: true,
  keepAlive: 300,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 30000
};


/**
 * Creates a Mongo DB connection
 * @param {string} endpoint - mongodb endpoint
 * @return {Promise}
 *  if success, a mongodb conn object
 *  if rejected, error
 */
const connect = (endpoint) => {
  return new Promise((resolve, reject) => {
    MongoClient.connect(endpoint, DB_PARAMS, (err, db) => {
      if (err) {
        reject(err);
      }
      else {
        resolve(db);
      }
    });
  });
};

/**
 * Setup tables schema and constraints in the Db
 * @param {object} db - MongoDb connection
 */
const initialSetup = async (db) => {

  // incidents collection
  await db.createCollection('incidents');

  db.collection('incidents').createIndex({ id: 1 }, { unique: true });
  db.collection('incidents').createIndex({ created_at: 1 });
  db.collection('incidents').createIndex({ type: 1 });

};

/**
 * Returns a DAO for a collection in the mongo db
 * @param {object} db Mongo db connection
 * @param {string} collectionName - collection name in mongo
 * @return {object} DAO functions
 *  find(), count(), insert(), update(), remove()
 */
const getDao = (db, collectionName) => {

  const dbCollection = db.collection(collectionName);

  /**
   * Find records in a collection
   * @param {object} pred - Predicate for find
   * @param {object} sort - Sort opiton
   * @return {Promise} promise
   *   on success - array of records
   *   on failure - Db error
   */
  const find = (pred, sort) => {
    return new Promise((resolve, reject) => {
      dbCollection.find(pred).sort(sort).toArray((err, res) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(res);
        }
      });
    });
  };

  /**
   * Count records in a collection
   * @param {object} pred - Predicate for count
   * @return {Promise} promise
   *   on success - count
   *   on failure - Db error
   */
  const count = (pred = {}) => {
    return new Promise((resolve, reject) => {
      dbCollection.count(pred, (err, cnt) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(cnt);
        }
      });
    });
  };


  /**
   * Insert a single record in a collection
   * @param {object} data - Data to insert
   * @return {Promise} promise
   *   on success - inserted record
   *   on failure - Db error
   */
  const insert = (data) => {

    // making a copy, b/c the save is modifying the original object
    const d = Object.assign({}, data);

    return new Promise((resolve, reject) => {
      dbCollection.insert(d, (err, res) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(res.ops[0]);
        }
      });
    });
  };

  /**
   * Update a record in a collection
   * @param {object} data - Data to be set on the record
   * @param {object} pred - Predicate to find record to update
   * @return {Promise} promise
   *   on success - update result
   *   on failure - Db error
   */
  const update = (data, pred) => {

    // making a copy, b/c the save is modifying the original object
    const d = Object.assign({}, data);

    return new Promise((resolve, reject) => {
      dbCollection.update(pred, d, { fullResult: true }, (err, res) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(res.result.nModified);
        }
      });
    });
  };

  /**
   * Delete record(s) from a collection
   * @param {object} pred - Predicate to find records to delete
   * @return {Promise} promise
   *   on success - # of records deleted
   *   on failure - Db error
   */
  const remove = (pred = {}) => {
    return new Promise((resolve, reject) => {
      dbCollection.deleteMany(pred, (err, res) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(res.deletedCount);
        }
      });
    });
  };

  return Object.create({
    name: collectionName,
    insert,
    update,
    count,
    find,
    remove
  });

};

/**
 * Initializes a new Mongo db object. This returns a wrapper over the
 * Mongo db connection exposing whatever functionality is needed.
 * @param {string} endpoint - mongo db endpoint
 * @return {Promise}
 *  if successful, db wrapper object
 *    setup()
 *    dao()
 *  if rejected, error
 */
const init = async (endpoint) => {

  const connection = await connect(endpoint);

  const db = {
    setup() {
      return initialSetup(connection);
    },
    dao(collectionName) {
      return getDao(connection, collectionName);
    }
  };

  return db;

};

export default { init };
