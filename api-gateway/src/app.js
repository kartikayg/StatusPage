/**
 * @fileoverview Start and stop for the application
 */

// internal packages
import config from './config';
import {init as initQueue} from './lib/messaging-queue';
import {initMQLogger} from './lib/logger';
import {connect as initRedis} from './lib/redis';
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

  // init redis
  const redis = initRedis(conf.db.REDIS_ENDPOINT);

  // init messaging queue
  messagingQueue = await initQueue(conf.server.RABBMITMQ_CONN_ENDPOINT, 120000);

  // init logger
  const logger = initMQLogger(conf.logger.LOG_LEVEL, messagingQueue, true);

  // load repositories
  const repos = respository.init({ redis });

  // start the server
  app = await server.start(conf.server, { repos, messagingQueue });

  logger.debug(`${process.env.SERVICE_NAME} has started on ${conf.server.PORT}.`);

  return app;

};

/**
 * Shuts down the microservice
 */
const shutdown = () => {

  if (messagingQueue) {
    messagingQueue.disconnect();
  }

  if (app) {
    app.close();
  }

};

export default { start, shutdown };
