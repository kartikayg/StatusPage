/**
 * @fileoverview This is a logger for this service.
 */

// {array} allowedLevels - allowed log levels
const allowedLevels = ['error', 'warn', 'info', 'debug'];

// {object} defaultLogger - object to export as default value.
const defaultLogger = {};


// {object} consoleLogger - logger object that uses console.
// this should really be only used for testing.
const consoleLogger = {
  log(...args) {
    console.log(...args); // eslint-disable-line no-console
  },
  error(...args) {
    this.log('error', ...args);
  },
  warn(...args) {
    this.log('warn', ...args);
  },
  info(...args) {
    this.log('info', ...args);
  },
  debug(...args) {
    this.log('debug', ...args);
  }
};


/**
 * Initializes a new logger that publishes the message to a
 * messaging queue.
 * @param {string} maxLevel - log level for this logger
 * @param {object} messagingQueue - messaging queue to publish the
 *  log message
 * @param {boolean} setDefault
 *  set {this} logger as the default logger for this package
 * @return {object} Logger
 */
const initMQLogger = (maxLevel, messagingQueue, setDefault = false) => {

  const logger = {};

  /**
   * Logs a message to the logger.
   * @param {string} level - level of the message. This is checked
   *  against the max level passed before.
   * @param {mixed} message - usually a string, but could be
   *  an object or Error
   * @param {object} meta - additional information to log
   * @return {void}
   */
  logger.log = (level, message, meta) => {

    // check against the max level if needed
    if (allowedLevels.indexOf(maxLevel) < allowedLevels.indexOf(level)) {
      return;
    }

    let logMessage = message;
    let logMeta = Object.assign({
      serviceName: process.env.SERVICE_NAME,
      timestamp: (new Date()).toISOString()
    }, meta || {});

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

    const toLog = {
      level,
      message: logMessage,
      meta: logMeta
    };

    // publish log on the messagingQueue
    messagingQueue.publish(toLog, 'logs', { routingKey: 'app' });

  };

  /* eslint-disable arrow-body-style */

  // wrapper log methods
  logger.error = (...args) => logger.log('error', ...args);
  logger.warn = (...args) => logger.log('warn', ...args);
  logger.info = (...args) => logger.log('info', ...args);
  logger.debug = (...args) => logger.log('debug', ...args);

  /* eslint-enable arrow-body-style */

  if (setDefault === true) {
    Object.assign(defaultLogger, logger);
  }

  return logger;

};


/**
 * Resets the default logger to console. This is useful
 * during testing
 */
const resetToConsole = () => {
  Object.assign(defaultLogger, consoleLogger);
};

resetToConsole();


// as default export, return the default logger
export default defaultLogger;

// other fn exports
export { initMQLogger };
export { allowedLevels };
export { resetToConsole };
