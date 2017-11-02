/**
 * @fileoverview Middleware to log all HTTP requests coming 
 * to the server. This uses a combination of winston and morgan.
 */

import morgan from 'morgan';
import winston from 'winston';

/**
 * Returns the middleware to log all requests
 * @param {object} conf - Configuration for the logger
 *   LOG_HTTP_REQUEST_WRITER - console OR file
 *   LOG_HTTP_REQUEST_DIRNAME - file writer conf
 *   LOG_HTTP_REQUEST_PREFIX  - file writer conf
 * @param {boolean} immediate - Whether to log right away or
 *  or at the end of the request. If immediate, some options
 *  may not be logged.
 * @return {function} express middleware
 */
export default (conf = {}, immediate = false) => {

  const level = 'info';

  const logger = new winston.Logger({ level });

  const formatter = (options) => {
    return options.message.trim();
  };

  // based on the 
  switch (conf.LOG_HTTP_REQUEST_WRITER) {

    case 'console':
      logger.add(winston.transports.Console, { formatter });
      break;

    case 'file':

      require('winston-daily-rotate-file'); // eslint-disable-line global-require

      logger.add(winston.transports.DailyRotateFile, {
        dirname: conf.LOG_HTTP_REQUEST_DIRNAME,
        filename: conf.LOG_HTTP_REQUEST_PREFIX || 'request',
        datePattern: '-yyyy-MM-dd.log',
        maxDays: 7,
        json: false,
        formatter
      });
      break;

    default:
      break;
  }

  function write(msg) {
    logger.log(level, msg.trim());
  }

  // what to log
  const fmt = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms';

  return morgan(fmt, { stream: { write }, immediate });

};
