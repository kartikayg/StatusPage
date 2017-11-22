/**
 * Entry point for the microservice/
 */

// internal packages
import config from './config';
import {init as initQueue} from './lib/messaging-queue';
import {init as initLogger} from './lib/logger';
import {init as initDb} from './lib/db/mongo';
import respository from './repositories';
import server from './server';

// {object} - messaging queue used for this app
let messagingQueue;

/**
 * Initalizes the microservice. Here are the main steps in this function:
 *  Load config
 *  Init Db adapter
 *  Setup logger writers
 *  Load Repos
 */
const start = async () => {

  // load config
  const conf = config.load(process.env);

  // init mongodb and setup tables
  const db = await initDb(conf.db.MONGO_ENDPOINT);
  await db.setup();

  // init messaging queue
  messagingQueue = await initQueue(conf.server.RABBMITMQ_CONN_ENDPOINT, 180000);

  // init logger
  const logger = initLogger(conf.logger.LOG_LEVEL, messagingQueue, true);

  // load repositories
  const repos = respository.init(db);

  // start the server
  await server.start(conf.server, { repos, messagingQueue });

  logger.debug('component-service application has started ...');

};

/**
 * Shuts down the microservice
 */
const stop = () => {
  messagingQueue.disconnect();
};

export default { start, stop };
