/**
 * @fileoverview Start and stop for the application
 */

// internal packages
import config from './config';
import {init as initQueue} from './lib/messaging-queue';
import defaultLogger, {initMQLogger} from './lib/logger';
import {init as initDb} from './lib/db/mongo';
import respository from './repositories';
import server from './server';

// {object} - messaging queue used for this app
let messagingQueue;

// {object} express application
let app;

/**
 * Add listeners to the messaging queue for logging messages.
 * @param {array} loggers
 *  - appLogger
 *  - reqLogger
 * @return {promise}
 */
const addQueueListeners = async (notificationRepo) => {

  const handle = (incidentObj) => {
    notificationRepo.onNewIncidentUpdate(incidentObj).catch(e => {
      defaultLogger.error(e);
    });
  };

  await messagingQueue.createExchange('incidents');

  await messagingQueue.subscribe(
    'notification-service-newincidentupdate',
    { exchangeName: 'incidents', bindingKey: 'new-update' },
    handle
  );

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
  messagingQueue = await initQueue(conf.server.RABBMITMQ_CONN_ENDPOINT, 30000);

  // init logger
  initMQLogger(conf.logger.LOG_LEVEL, messagingQueue, true);

  // load repositories
  const repos = respository.init(db);

  // start the server
  app = await server.start(conf.server, { repos, messagingQueue, db });

  // add listeners on queue
  await addQueueListeners(repos.notification);

  defaultLogger.debug(`${process.env.SERVICE_NAME} has started on ${conf.server.PORT}.`);

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
