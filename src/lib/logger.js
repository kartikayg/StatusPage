/**
 * @fileoverview Using wiston library as the logger. 
 * By default, no writer is enabled so nothing will get logged.
 * Enable writers to start logging.
 */

import winston from 'winston';
import {MongoDB as winstonmongodb} from 'winston-mongodb';


// add some default meta information to each log message
// const metaRewriter = (level, msg, meta) => {
//   meta.url = '123';
//   return meta;
// };


const logger = exports;


/**
 * Getter/setter for the level property
 */
Object.defineProperty(logger, 'level', {
  get() {
    return winston.level;
  },
  set(val) {
    winston.level = val;
  }
});


// so far, this logger supports two writers (console and db).
// More writers can be added as needed.

/**
 * Add console writer for this logger
 * @param {string} level.
 */
logger.addConsoleWriter = (level) => {

  winston.add(winston.transports.Console, {
    level,
    colorize: true,
    timestamp: true,
    json: true,
    stringify: true
  });

};

/**
 * Add db writer for this logger
 * @param {string} level.
 * @param {object} mongo db connection
 */
logger.addDbWriter = (level, db) => {

  winston.add(winstonmongodb, {
    level,
    db,
    storeHost: true,
    capped: true,
    cappedMax: 100000
  });

};

/**
 * Remove all writers from this logger
 */
logger.removeAllWriters = () => {
  winston.clear();
};

/**
 * Log methods that internally will call winston to log
 */
['error', 'warn', 'info', 'debug'].forEach(m => {
  logger[m] = (...args) => {
    return winston[m](...args);
  };
});

/**
 * DEFAULT SETTINGS
 */

// the level is set to the lowest. the idea is that winston will try to log
// everything, but depending on the writer's level, it will either write it 
// or not. so its important to set each writer level properly.
logger.level = 'debug';

// remove all writers. they should be enabled based on the env settings
logger.removeAllWriters();
