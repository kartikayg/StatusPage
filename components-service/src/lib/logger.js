/**
 * @fileoverview Exposes logging functionality. This uses 
 * wiston library as the logger.
 *
 * By default, no writer is enabled, so nothing will get logged.
 * Writers are enabled based on configuration.
 */

import winston from 'winston';


// Log levels supported
export const logLevels = ['error', 'warn', 'info', 'debug'];


/**
 * Logs a message using winston library
 * @param {string} level
 * @param {string} message preferably a string. Otherwise:
 *    object - json.stringify()
 *    Error  - Error.message
 * @param {object} meta - any information to add to the log
 */
export const log = (level, message, meta) => {

  let logMessage = message;
  let logMeta = Object.assign({}, meta || {});

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
    return log(level, message, meta);
  };
});


/**
 * Add writers for logging. Based on the configuration, it will
 * add the respective writer for the log.
 * @param {object} conf - Configuration for writers
 *  LOG_CONSOLE_LEVEL
 *  LOG_FILE_LEVEL
 *  LOG_DB_LEVEL
 *  LOG_FILE_DIRNME
 *  LOG_FILE_PREFIX
 * @param {object} options
 *  db - Db object for db writer
 */
export const initWriters = (conf, options) => {

  // remove any writers (transporters)
  winston.clear();

  if (conf.LOG_CONSOLE_LEVEL) {
    addConsoleWriter(winston, conf.LOG_CONSOLE_LEVEL); // eslint-disable-line no-use-before-define
  }

  if (conf.LOG_FILE_LEVEL) {
    addFileWriter(winston, conf.LOG_FILE_LEVEL, conf); // eslint-disable-line no-use-before-define
  }

  if (conf.LOG_DB_LEVEL) {
    addDbWriter(winston, conf.LOG_DB_LEVEL, options.db); // eslint-disable-line no-use-before-define
  }

};


/**
 * Add console writer to the logger.
 * @param {object} logger - logger to add the writer to
 * @param {string} level - level for the writer
 */
function addConsoleWriter(logger, level) {

  logger.add(winston.transports.Console, {
    level,
    formatter: (options) => {

      const ops = Object.assign({}, options);

      let output = `[${(new Date()).toISOString()}: ` +
                   `${winston.config.colorize(ops.level, ops.level.toUpperCase())}] - ` +
                   `${ops.message} `;

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
 * Add db writer to the logger
 * @param {object} logger - logger to add writer to
 * @param {string} level - level for the writer
 * @param {object} db - mongo db connection
 */
function addDbWriter(logger, level, db) {

  if (!db) {
    throw new Error('A Db object is required to setup this writer.');
  }

  require('winston-mongodb'); // eslint-disable-line global-require

  logger.add(winston.transports.MongoDB, {
    level,
    db,
    storeHost: true,
    capped: true,
    cappedMax: 100000
  });

}

/**
 * Add File writer to the logger
 * @param {object} logger - logger to add writer to
 * @param {string} level - level for the writer
 * @param {object} conf - config for the writer
 *  LOG_FILE_DIRNAME
 *  LOG_FILE_PREFIX
 */
function addFileWriter(logger, level, conf) {

  if (!conf.LOG_FILE_DIRNAME) {
    throw new Error('A file directory is required to setup this writer.');
  }

  require('winston-daily-rotate-file'); // eslint-disable-line global-require

  logger.add(winston.transports.DailyRotateFile, {
    level,
    dirname: conf.LOG_FILE_DIRNAME,
    filename: conf.LOG_FILE_PREFIX || 'log',
    datePattern: '-yyyy-MM-dd.log',
    maxDays: 7,
    json: false,
    formatter: (options) => {

      const output = Object.assign(
        {},
        { level: options.level },
        { timestamp: (new Date()).toISOString() },
        { message: options.message },
        { meta: options.meta || {} }
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
