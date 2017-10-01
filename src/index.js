// npm packges
import dotenv from 'dotenv';

// internal packages
import config from './config';
import logger from './lib/logger';
import dbAdapter from './lib/db-adapter';

/**
 * Initalizes the service. Here are the main steps in this function:
 *  Load config
 *  Initialize logger
 */
const init = async () => {

  // load config
  dotenv.config();
  const conf = config.load(process.env);

  // load mongodb
  const db = await dbAdapter.connect(conf.db, true);

  // init logger
  logger.init(conf.logger, db);

  logger.error('here there');

  // load repositories

  // start the server

};

init()
  .catch((e) => {
    console.error(`Problem initializing the app: ${e}`);
  });
