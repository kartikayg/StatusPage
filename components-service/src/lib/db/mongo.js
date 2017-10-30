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
 * @param {object} conf - DB config object
 *   - mongo_url - connection string. e.g.: mongodb://db/componentservice
 * @return {Promise} promise object that resolves to a 
 * db connection object.
 */
export const connect = (conf = {}) => {
  return new Promise((resolve, reject) => {
    MongoClient.connect(conf.MONGO_ENDPOINT, DB_PARAMS, (err, db) => {
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
 * Returns a DAO for a collection in the mongo db
 * @param {object} Mongo db connection
 * @param {string} collectionName collection name in mongo
 * @return {object}
 */
export const getDao = (db, collectionName) => {

  const dbCollection = db.collection(collectionName);


  /**
   *
   */
  const find = (pred = {}, sort = {}) => {
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
   *
   */
  const count = (pred) => {
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
   *
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
          resolve(res);
        }
      });
    });
  };

  /**
   *
   */
  const update = (data, pred) => {

    // making a copy, b/c the save is modifying the original object
    const d = Object.assign({}, data);

    return new Promise((resolve, reject) => {
      dbCollection.update(pred, d, (err, res) => {
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
   *
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

