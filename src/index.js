// npm packges
import dotenv from 'dotenv';

// internal packages
import config from './config';
import logger from './lib/logger';

/**
 * Initalizes the service. Here are the main steps in this function:
 *  Load config
 *  Initialize logger
 */
const init = async () => {

  // load config
  dotenv.config();
  const conf = config.load(process.env);

  // init logger
  logger.init(conf.logger);

  // load mongodb
  

  logger.info(conf);

  // load repositories

  // start the server
};

init()
  .catch((e) => {
    console.error(`Problem initializing the app: ${e}`);
  });
