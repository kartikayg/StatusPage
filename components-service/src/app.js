/**
 * Entry point for the microservice/
 */

// internal packages
import config from './config';
import {init as initQueue} from './lib/messaging-queue';
import {initMQLogger} from './lib/logger';
import {init as initDb} from './lib/db/mongo';
import respository from './repositories';
import server from './server';

// {object} - messaging queue used for this app
let messagingQueue;

// {object} express application
let app;

/**
 * Initalizes the microservice. Here are the main steps in this function:
 *  Load config
 *  Init Db adapter
 *  Setup logger writers
 *  Load Repos
 * @return {object} express app
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
  const logger = initMQLogger(conf.logger.LOG_LEVEL, messagingQueue, true);

  // load repositories
  const repos = respository.init(db);

  // start the server
  app = await server.start(conf.server, { repos, messagingQueue });

  logger.debug('component-service application has started ...');

  return app;

};

/**
 * Shuts down the microservice
 */
const stop = () => {
  messagingQueue.disconnect();
  app.close();
};

export default { start, stop };
