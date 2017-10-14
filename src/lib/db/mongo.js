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
const connect = (conf = {}) => {

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

export default Object.create({ connect });

