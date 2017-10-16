/**
 * @fileoverview Middleware to log all HTTP requests coming 
 * to the server
 */

import morgan from 'morgan';
import winston from 'winston';

/**
 * Returns the middleware to log all requests
 * @param {string} logWriter - Which log writer to use
 *   file or console
 */
export default (conf = {}) => {

  const logger = new winston.Logger({
    level: 'info'
  });

  // based on the 
  switch (conf.LOG_HTTP_REQUEST_WRITER) {

    case 'console':
      logger.add(winston.transports.Console, {
        formatter: (options) => {
          return options.message.trim();
        }
      });
      break;

    case 'file':

      require('winston-daily-rotate-file'); // eslint-disable-line global-require

      logger.add(winston.transports.DailyRotateFile, {
        level: 'info',
        dirname: conf.LOG_HTTP_REQUEST_DIRNAME,
        filename: conf.LOG_HTTP_REQUEST_PREFIX,
        datePattern: '-yyyy-MM-dd.log',
        maxDays: 7,
        json: false,
        formatter: (options) => {
          return options.message.trim();
        }
      });
      break;

    default:
      break;
  }

  function write(msg) {
    logger.log('info', msg.trim());
  }

  // what to log
  const fmt = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms';

  return morgan(fmt, { stream: { write } });

};
