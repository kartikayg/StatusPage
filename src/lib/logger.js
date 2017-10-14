/**
 * @fileoverview Exposes logging functionality. This uses 
 * wiston library as the logger.
 *
 * By default, no writer is enabled, so nothing will get logged.
 * Writers are enabled based on configuration.
 */

import winston from 'winston';
import 'winston-mongodb';
import 'winston-daily-rotate-file';


// Log levels supported
export const logLevels = ['error', 'warn', 'info', 'debug'];


/**
 * Logs a message using winston library
 *
 * @param {object} conf
 *  - level
 *  - message preferably a string. Otherwise:
 *    object - json.stringify()
 *    Error  - Error.message
 *  - meta any information to add the log
 */
export const log = ({ level, message, meta }) => {

  let logMessage = message;
  let logMeta = Object.assign({}, meta || {});

  // if the message is an error
  if (message instanceof Error) {

    logMessage = message.message;

    logMeta = Object.assign(logMeta, {
      stack: message.stack,
      code: message.code || message.status || 500,
      name: message.name,
      isError: true
    });

  }
  // if its not a string
  else if (typeof message !== 'string') {
    logMessage = JSON.stringify(message);
  }

  winston.log(
    level,
    logMessage,
    logMeta
  );

};

/**
 * Helper log methods for each level
 */
logLevels.forEach(level => {
  exports[level] = (message, meta) => {
    return log({ level, message, meta });
  };
});


/**
 * Add writers for logging. Based on the configuration, it will
 * add the respective writer for the log.
 * @param {object} conf
 * @param {object} options
 */
export const initWriters = (conf = {}, options = {}) => {

  // remove any writers (transporters)
  winston.clear();

  if (conf.LOG_CONSOLE_LEVEL) {
    // eslint-disable-next-line no-use-before-define
    addConsoleWriter({ logger: winston, level: conf.LOG_CONSOLE_LEVEL });
  }

  if (conf.LOG_FILE_LEVEL) {
    // eslint-disable-next-line no-use-before-define
    addFileWriter({
      logger: winston,
      level: conf.LOG_FILE_LEVEL,
      dirName: conf.LOG_FILE_DIRNAME,
      prefix: conf.LOG_FILE_PREFIX
    });
  }

  if (conf.LOG_DB_LEVEL && options.db) {
    // eslint-disable-next-line no-use-before-define
    addDbWriter({
      logger: winston,
      level: conf.LOG_DB_LEVEL,
      db: options.db
    });
  }

};


/**
 * Add console writer for this logger.
 * @param {object} logger
 * @param {string} level.
 */
function addConsoleWriter({ logger, level }) {

  logger.add(winston.transports.Console, {
    level,
    formatter: (options) => {

      const ops = Object.assign({}, options);

      let output = `[${(new Date()).toISOString()}: ` +
                   `${winston.config.colorize(ops.level, ops.level.toUpperCase())}] - ` +
                   `${ops.message ? ops.message : ''} `;

      if (ops.meta && Object.keys(ops.meta).length) {

        if (ops.meta.isError === true) {
          output += `\n${ops.meta.stack}\n`;
          delete ops.meta.stack;
        }

        output += JSON.stringify(ops.meta);

      }

      return output;

    }

  });

}

/**
 * Add db writer for this logger
 * @param {object} logger
 * @param {string} level.
 * @param {object} mongo db connection
 */
function addDbWriter({ logger, level, db }) {

  logger.add(winston.transports.MongoDB, {
    level,
    db,
    storeHost: true,
    capped: true,
    cappedMax: 100000
  });

}

/**
 * Add File writer for this logger
 * @param {object} logger
 * @param {string} level
 */
function addFileWriter({ logger, level, dirName, prefix }) {

  logger.add(winston.transports.DailyRotateFile, {
    level,
    dirname: dirName,
    filename: prefix,
    datePattern: '-yyyy-MM-dd.log',
    maxDays: 7,
    json: false,
    formatter: (options) => {

      const output = Object.assign(
        {},
        {level: options.level},
        {timestamp: (new Date()).toISOString()},
        {message: options.message},
        {meta: options.meta || {}}
      );

      return JSON.stringify(output);

    }
  });

}


/**
 * DEFAULT SETTINGS
 */

// the level is set to the lowest. the idea is that winston will try to log
// everything, but depending on the writer's level, it will either write it 
// or not. so its important to set each writer level properly.
winston.level = 'debug';

// remove all writers. they should be enabled based on the env settings
winston.clear();
