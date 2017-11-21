/**
 * @fileoverview Logger to log request calls from other services. It uses a
 * winston logger internall to log the calls.
 */

import winston from 'winston';
import 'winston-daily-rotate-file';
import pick from 'lodash/fp/pick';


/**
 * Creates a winston logger.
 */
const createWinstonLogger = (writers, options) => {

  // custom log level
  const levelName = 'httprequest';
  const customLevel = {
    levels: {
      [levelName]: 0
    },
    colors: {
      [levelName]: 'blue'
    }
  };


  // logger for request
  const wLogger = new (winston.Logger)({ levels: customLevel.levels, colors: customLevel.colors });
  winston.addColors(customLevel);

  // remove all writers by default and then based on the argument
  wLogger.clear();

  // console writer
  if (writers.includes('console')) {
    wLogger.add(winston.transports.Console, {
      level: levelName,
      formatter: (logData) => {

        const { meta } = logData;

        const output = `[${levelName.toUpperCase()}:${meta.serviceName}]` +
                     ` - ${logData.timestamp || (new Date()).toISOString()} ` +
                     `${meta.method} ${meta.url} ${meta.ip} ${meta.status} ${meta.contentLength} ${meta.responseTime}`;

        return output;

      }
    });
  }

  // file writer
  if (writers.includes('file')) {
    wLogger.add(winston.transports.DailyRotateFile, {
      level: levelName,
      dirname: options.file.dirname,
      filename: 'requestlog',
      datePattern: '-yyyy-MM-dd.log',
      maxDays: 7,
      json: false,
      formatter: (logData) => {

        const output = Object.assign(
          {},
          { timestamp: (new Date()).toISOString() },
          pick(['serviceName', 'method', 'url', 'ip', 'status', 'contentLength', 'responseTime', 'timestamp'], logData.meta),
          { level: levelName }
        );

        return JSON.stringify(output);

      }
    });
  }

  return wLogger;

};


/**
 * Initializes a new request logger.
 * @param {array} writers - writers to add to this logger
 *   - file
 *   - console
 * @param {object} options
 *   - file: { dirname }
 * @return {function} log function.
 */
const init = (writers, options) => {

  // winston logger
  const wLogger = createWinstonLogger(writers, options);

  /**
   * {function} - return a function to log the request. This
   * will call winston log
   */
  return (request) => {
    wLogger.log('httprequest', request);
  };

};

export default { init };
