/**
 * Db adapter to use in this microservice. Its using MongoDB as the
 * backend service.
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
 * @param {boolean} doInitialSetup
 *    pass true to setup tables and constraints
 * @return {Promise} promise object that resolves to a 
 * db connection object.
 */
const connect = (conf = {}, doInitialSetup = false) => {

  return new Promise((resolve, reject) => {

    MongoClient.connect(conf.mongo_url, DB_PARAMS, (err, db) => {

      if (err) {
        reject(err);
      }
      else if (doInitialSetup === true) {

        doInitialSetup(db)
          .then(() => {
            resolve(db);
          })
          .catch(err2 => {
            reject(err2);
          });

      }
      else {
        resolve(db);
      }

    });

  });

};

/**
 * Initial setup of the tables and constraint in the database.
 * @param {object} db connection
 * @return {Promise}
 */
const doInitialSetup = (db) => {

  return new Promise((resolve, reject) => {
    resolve(db);
    reject();
  });

};

export default Object.create({ connect, doInitialSetup });
