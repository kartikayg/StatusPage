/**
 * @fileoverview
 */

// npm packges
import dotenv from 'dotenv';
import dotenvParseVariables from 'dotenv-parse-variables';

// internal packages
import config from './config';
import {init as initAppLogger} from './lib/logger/application';
import {init as initReqLogger} from './lib/logger/request';
import {init as initQueue} from './lib/messaging-queue';

/**
 * Initalizes the microservice. Here are the main steps in this function:
 *  Load config
 *  Setup loggers
 *  Setup messaging queues
 *  Add listeners on the queue
 */
const init = async () => {

  // load config
  const env = dotenv.config();
  if (env.error) {
    throw env.error;
  }
  const conf = config.load(dotenvParseVariables(env.parsed));

  // setup the application and request loggers
  const appLogger = initAppLogger(
    conf.logger.LOG_LEVEL,
    conf.logger.LOG_APPLICATION_WRITER,
    { file: {dirname: conf.logger.LOG_FILE_DIRNAME } },
    true
  );

  const reqLogger = initReqLogger(
    conf.logger.LOG_REQUEST_WRITER,
    { file: {dirname: conf.logger.LOG_FILE_DIRNAME } }
  );

  // setup messaging queue
  const messagingQueue = await initQueue(conf.server.RABBMITMQ_CONN_ENDPOINT, 180000);

  // add listeners on the messaging queue
  await addQueueListeners(messagingQueue, { appLogger, reqLogger });

};

/**
 * Add listeners to the messaging queue for logging messages.
 * @param {object} queue - messaging queue
 * @param {array} loggers
 *  - appLogger
 *  - reqLogger
 * @return {promise}
 */
const addQueueListeners = async (messagingQueue, loggers) => {

  // consume application logs queue and send it to the logger
  const handleAppLog = (msg) => {
    try {
      if (typeof msg === 'object') {
        loggers.appLogger.log(msg.level, msg.message, msg.meta, true);
      }
    }
    catch (e) {} // eslint-disable-line no-empty
  };

  await messagingQueue.subscribe('logger-service-applog', { exchangeName: 'logs', bindingKey: 'app' }, handleAppLog);

  // consume request logs queue and send it to the logger
  const handleReqLog = (msg) => {
    try {
      if (typeof msg === 'object') {
        loggers.reqLogger(msg);
      }
    }
    catch (e) {} // eslint-disable-line no-empty
  };
  await messagingQueue.subscribe('logger-service-reqlog', { exchangeName: 'logs', bindingKey: 'request' }, handleReqLog);

};


init()
  .catch((e) => {
    console.error('Problem initializing the app'); // eslint-disable-line no-console
    console.error(e); // eslint-disable-line no-console
    process.exit(1);
  });
