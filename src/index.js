/**
 * Entry point for the microservice/
 */

// npm packges
import dotenv from 'dotenv';

// internal packages
import config from './config';
import logger from './lib/logger';
import mongodb from './lib/db/mongo';
import dbsetup from './lib/db/setup';

/**
 * Initalizes the microservice. Here are the main steps in this function:
 *  Load config
 *  Init Db adapter
 *  Setup logger writers
 *  
 */
const init = async () => {

  // load config
  dotenv.config();
  const conf = config.load(process.env);

  // load mongodb and setup tables
  const db = await mongodb.connect(conf.db);
  await dbsetup(db);

  // configure logger
  if (conf.logger.console) {
    logger.addConsoleWriter(conf.logger.console);
  }

  if (conf.logger.db) {
    logger.addDbWriter(conf.logger.db, db);
  }

  // load repositories


  // start the server

};


init()
  .catch((e) => {
    console.error(`Problem initializing the app: ${e}`); // eslint-disable-line no-console
  });
