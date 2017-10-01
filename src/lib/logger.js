/**
 * Using wiston library as the logger.
 */

import winston from 'winston';
import {MongoDB as winstonmongodb} from 'winston-mongodb';

/**
 * Initializes the logger.
 * @param {object} conf - Configuration to setup the logger
 *  - isEnabled
 *  - level
 * @param {object} db - Database connection
 */
function init(conf = {}, db) {

  // remove all default transporters
  winston.configure({
    transports: []
  });

  // if not disabled
  if (conf.isEnabled !== false) {

    winston.level = conf.level || 'debug';

    // add transporters

    winston.add(winston.transports.Console, {
      level: 'debug',
      colorize: true,
      timestamp: true,
      json: true,
      stringify: true
    });

    winston.add(winstonmongodb, {
      level: 'warn',
      db,
      storeHost: true,
      capped: true,
      cappedMax: 100000
    });

  }

}

export default Object.create({
  init,
  error: winston.error,
  warn: winston.warn,
  info: winston.info,
  debug: winston.debug
});
