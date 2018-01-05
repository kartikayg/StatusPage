/**
 * @fileoverview Start and stop for the application
 */

// internal packages
import config from './config';
import {init as initQueue} from './lib/messaging-queue';
import {initMQLogger} from './lib/logger';
import {init as initDb} from './lib/db/mongo';
import respository from './repositories';
import server from './server';
import cron from './lib/cron';

// {object} - messaging queue used for this app
let messagingQueue;

// {object} express application
let app;

/**
 * Add cron jobs
 */
const setupCron = async (repos) => {

  const scheduleRepo = await repos.incident.ofType('scheduled');

  // auto update scheduled incidents every minute
  cron.addJob('00 * * * * *', scheduleRepo.autoUpdate);

};

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
  messagingQueue = await initQueue(conf.server.RABBMITMQ_CONN_ENDPOINT, 120000);

  // init logger
  const logger = initMQLogger(conf.logger.LOG_LEVEL, messagingQueue, true);

  // load repositories
  const repos = respository.init(db, messagingQueue);

  // start the server
  app = await server.start(conf.server, { repos, messagingQueue });

  // setup the cron
  await setupCron(repos);

  logger.debug('incidents-service has started ...');

  return app;

};


/**
 * Shuts down the microservice
 */
const shutdown = () => {

  cron.stopAll();

  if (messagingQueue) {
    messagingQueue.disconnect();
  }

  if (app) {
    app.close();
  }

};

export default { start, shutdown };
