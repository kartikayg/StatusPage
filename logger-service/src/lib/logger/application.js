/**
 * @fileoverview Logger to log application logs from this and other services
 * It uses a winston logger internall to log the calls.
 */

import winston from 'winston';
import 'winston-daily-rotate-file';
import omit from 'lodash/fp/omit';

/**
 * {object} defaultLogger - default instance of this app logger.
 * It is initialized at the end of this module.
 */
const defaultLogger = {};

// {array} allowedLevels - allowed log levels
const allowedLevels = ['error', 'warn', 'info', 'debug'];

/**
 * Creates a winston logger.
 */
const createWinstonLogger = (writers, options) => {

  // create a winston logger. by default, set the level
  // as the lowest. this is b/c the logger will allow an option to
  // always log regardless of the level. so the logic for level
  // will be checked separately.
  const wLogger = new (winston.Logger)({ level: 'debug' });

  // remove all writers
  wLogger.clear();

  // console writer
  if (writers.includes('console')) {
    wLogger.add(winston.transports.Console, {
      formatter: (logData) => {

        const lMeta = logData.meta;

        const { serviceName } = lMeta;
        let output = `[${winston.config.colorize(logData.level, logData.level.toUpperCase())}:${serviceName}]` +
                   ` - ${logData.timestamp || (new Date()).toISOString()}` +
                   ` ${logData.message} `;

        if (lMeta && Object.keys(lMeta).length) {

          if (lMeta.isError === true) {
            output += `\n${lMeta.stack}\n`;
          }

          // log any more meta info if there is anything left
          const newMeta = omit(['serviceName', 'stack', 'isError', 'timestamp'], lMeta);
          if (Object.keys(newMeta).length) {
            output += JSON.stringify(newMeta);
          }

        }

        return output;

      }

    });

  }

  // file writer
  if (writers.includes('file')) {
    wLogger.add(winston.transports.DailyRotateFile, {
      dirname: options.file.dirname,
      filename: 'applog',
      datePattern: '-yyyy-MM-dd.log',
      maxDays: 7,
      json: false,
      formatter: (logData) => {
        const output = {
          level: logData.level,
          serviceName: logData.meta.serviceName,
          timestamp: logData.meta.timestamp || (new Date()).toISOString(),
          message: logData.message,
          meta: omit(['serviceName', 'timestamp'], logData.meta)
        };

        return JSON.stringify(output);
      }
    });
  }

  return wLogger;

};

/**
 * Given a winston logger, this creates a wraper over it exposing functionality
 * that is needed.
 * @param {string} maxLevel
 * @param {object} wLogger - winston logger
 * @return {object} logger
 */
const createLoggerWrapper = (maxLevel, wLogger) => {

  /**
   * Logs a message to the winston logger.
   * @param {string} level - level of the message. This is checked
   *  against the max level passed before.
   * @param {mixed} message - usually a string, but could be
   *  an object or Error
   * @param {object} meta - additional information to log
   * @param {boolean} bypassLevelCheck - pass true to log regardless of the
   *   level
   * @return {void}
   */
  const log = (level, message, meta, bypassLevelCheck = false) => {

    // check against the max level if needed
    if (bypassLevelCheck !== true
        && allowedLevels.indexOf(maxLevel) < allowedLevels.indexOf(level)) {
      return;
    }

    let logMessage = message;
    let logMeta = Object.assign({ serviceName: 'logger-service' }, meta || {});

    // if the message is an error
    if (message instanceof Error) {

      const err = message;

      logMessage = err.message;

      logMeta = Object.assign(logMeta, {
        stack: err.stack,
        code: err.code || err.status || 500,
        name: err.name,
        isError: true
      });

    }
    // if its not a string
    else if (typeof message !== 'string') {
      logMessage = JSON.stringify(message);
    }

    // log using winston
    wLogger.log(level, logMessage, logMeta);

  };

  /* eslint-disable arrow-body-style */

  // wrapper log methods
  const error = (...args) => log('error', ...args);
  const warn = (...args) => log('warn', ...args);
  const info = (...args) => log('info', ...args);
  const debug = (...args) => log('debug', ...args);

  /* eslint-enable arrow-body-style */

  return {
    level: maxLevel,
    log,
    error,
    warn,
    info,
    debug
  };

};


/**
 * Initializes a new application logger.
 * @param {string} maxLevel - log level for this logger
 * @param {array} writers - writers to add to this logger
 *  - file
 *  - console
 * @param {object} options
 *  - file: { dirname }
 * @param {boolean} setDefault
 *  set {this} logger as the default logger for this package
 * @return {object} Logger
 */
const init = (maxLevel, writers, options, setDefault = false) => {

  // winston logger
  const wLogger = createWinstonLogger(writers, options);

  // wrapper
  const loggerWrapper = createLoggerWrapper(maxLevel, wLogger);

  // set default if asked
  if (setDefault === true) {
    Object.assign(defaultLogger, loggerWrapper);
  }

  return loggerWrapper;

};


// initialize a default logger with console writer.
init('error', ['console'], {}, true);


// as default export, return the default logger
export default defaultLogger;

// other fn exports
export { init };
export { allowedLevels };

