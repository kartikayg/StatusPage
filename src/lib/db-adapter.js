import MongoClient from 'mongodb';

const DB_PARAMS = {
  w: 'majority',
  wtimeout: 10000,
  j: true,
  readPreference: 'ReadPreference.SECONDARY_PREFERRED',
  native_parser: false
};

const SERVER_PARAMS = {
  autoReconnect: true,
  poolSize: 10,
  socketoptions: {
    keepAlive: 300,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000
  }
};

/**
 * Creates a Mongo DB connection
 * @param {object} conf - DB config object
 *   - mongo_url
 * @param {boolean} doInitialSetup
 * @return {Promise} promise object that resolves to a 
 * db connection object.
 */
const connect = (conf = {}, doInitialSetup = false) => {

  return new Promise((resolve, reject) => {

    MongoClient.connect(conf.mongo_url, {
      db: DB_PARAMS,
      server: SERVER_PARAMS
    }, function(err, db) {
      
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
