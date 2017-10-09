/**
 * Using wiston library as the logger. By default, the logger
 * is enabled with Console transporter. Use the configure fn
 * to change it.
 */

import winston from 'winston';
import {MongoDB as winstonmongodb} from 'winston-mongodb';

/**
 * Change logger configuration.
 * @param {object} conf - Configuration to setup the logger
 *  - isEnabled
 *  - level
 * @param {object} db - Database connection. Used in Db transporter.
 */
function configure(conf = {}, db) {

  // if not disabled
  if (conf.isEnabled !== false) {

    winston.level = conf.level || 'debug';

    /* eslint-disable no-param-reassign */

    // rewriter to add extra info to the meta
    const metaRewriter = (level, msg, meta) => {
      meta.url = '123';
      return meta;
    };

    /* eslint-enable no-param-reassign */

    // configure with no transporter and a rewriters
    winston.configure({
      rewriters: [metaRewriter]
    });

    // add transporters now: console & db
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
  else {

    // remove all default transporters, so nothing will be logged
    winston.configure({
      transports: []
    });
  }

}

export default Object.create({
  configure,
  error: winston.error,
  warn: winston.warn,
  info: winston.info,
  debug: winston.debug
});
