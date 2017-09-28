/**
 * Using wiston library as the logger.
 */

import winston from 'winston';

/**
 * Initializes the logger.
 * @param {object} conf
 */
function init(conf = {}) {

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

  }

}

export default Object.create({
  init,
  error: winston.error,
  warn: winston.warn,
  info: winston.info,
  debug: winston.debug
});
