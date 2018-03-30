/**
 * @fileoverview Start and stop for the application
 */

// npm packges
import dotenvParseVariables from 'dotenv-parse-variables';
import express from 'express';
import compress from 'compression';
import methodOverride from 'method-override';
import cors from 'cors';
import helmet from 'helmet';

// internal packages
import config from './config';
import {init as initAppLogger} from './lib/logger/application';
import {init as initReqLogger} from './lib/logger/request';
import {init as initQueue} from './lib/messaging-queue';
import thisPackage from '../package.json';

// {object} - messaging queue used for this app
let messagingQueue;

/**
 * Initalizes the microservice. Here are the main steps in this function:
 *  Load config
 *  Setup loggers
 *  Setup messaging queues
 *  Add listeners on the queue
 */
const start = async () => {

  // load config
  let env = Object.assign({}, process.env);
  env = dotenvParseVariables(env);
  const conf = config.load(env);

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
  messagingQueue = await initQueue(conf.server.RABBMITMQ_CONN_ENDPOINT, 30000);

  // add listeners on the messaging queue
  await addQueueListeners({ appLogger, reqLogger });

  // setup health check endpoint
  setupHealthCheck(conf.server.PORT);

  appLogger.debug(`${process.env.SERVICE_NAME} has started on ${conf.server.PORT}.`);

};

/**
 * Add listeners to the messaging queue for logging messages.
 * @param {array} loggers
 *  - appLogger
 *  - reqLogger
 * @return {promise}
 */
const addQueueListeners = async (loggers) => {

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

  await messagingQueue.createExchange('logs');

  await messagingQueue.subscribe(
    'logger-service-reqlog',
    { exchangeName: 'logs', bindingKey: 'request' },
    handleReqLog
  );

};

/**
 * Setup health check endpoint for this service.
 * @param {int} port
 */
const setupHealthCheck = (port) => {

  // setup health-check endpoint
  const server = express();

  server.use(compress());
  server.use(methodOverride());

  // secure apps by setting various HTTP headers
  server.use(helmet());

  // enable CORS - Cross Origin Resource Sharing
  server.use(cors());

  server.get('/logger-service/api/health-check', (req, res) => {
    if (messagingQueue && messagingQueue.isActive() === false) {
      return res.status(500).json({ message: 'Messaging queue is not available.' });
    }
    return res.json({
      status: 'RUNNING',
      name: thisPackage.name,
      version: thisPackage.version,
      environment: process.env.NODE_ENV
    });
  });

  server.listen(port);

};

/**
 * Shuts down the microservice
 */
const shutdown = () => {
  if (messagingQueue) {
    messagingQueue.disconnect();
  }
};

export default { start, shutdown };
