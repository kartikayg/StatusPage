/**
 * @fileoverview Exposes functions for a messaging queue. This uses RabbitMq
 * as the library for the queue.
 */

import amqp from 'amqp';
import omit from 'lodash/fp/omit';
import isJson from 'is-json';
import _pick from 'lodash/fp/pick';

import logger from './logger/application';


/**
 * Connects to a rabbitmq queue
 * @param {string} endpoint
 * @param {number} timeout (ms)
 */
const connect = (endpoint, timeout) => {

  return new Promise((resolve, reject) => {

    let isReady = false;
    let initialReady = false;

    // create a connection with the server with reconnect option
    const connOptions = {
      reconnect: 'true',
      reconnectBackoffStrategy: 'exponential',
      reconnectExponentialLimit: 5000
    };
    const connection = amqp.createConnection({ url: endpoint }, connOptions);

    // if the connection is not established within timeout limit, error out
    const timeoutId = setTimeout(() => {
      if (initialReady === false) {
        logger.debug(`raabit mq server connection timed out: ${endpoint}.`);
        reject(new Error(`Not able to establish a connection with the server: ${endpoint}.`));
      }
    }, timeout);

    // Wait for connection to become established. once done, return the
    // queue object
    connection.on('ready', () => {
      logger.debug(`raabit mq server connection ready: ${endpoint}.`);
      isReady = true;
      initialReady = true;
      clearTimeout(timeoutId);
      resolve(connection);
    });

    // when connection ends and it was ready before, reconnects
    connection.on('end', () => {
      if (isReady) {
        logger.debug(`raabit mq server connection ended: ${endpoint}. Trying to reconnect ...`);
        isReady = false;
        connection.reconnect();
      }
    });

    // on error, log it
    connection.on('error', (e) => {
      logger.error(e);
    });

  });

};

/**
 * Given a rabbitmq connection, returns a queue wrapper exposing whatever
 * functionality is needed
 * @param {object} rabbitmq connection
 * @return {object}
 */
const queueWrapper = (connection) => {

  /**
   * Subscribes to a queue
   * @param {string} queueName - name of the queue
   * @param {object} options
   *   exchangeName
   *   bindingKey
   *   ... - other misc options for the queue
   * @param {function} callback - function to call when there is a new
   *   message on the queue
   * @return {promise}
   */
  const subscribe = (queueName, options, callback) => {

    // apply defaults to the queue options
    const queueOpts = Object.assign({}, {
      durable: true,
      autoDelete: false
    }, options);

    return new Promise((resolve) => {

      const qOpts = omit(['exchangeName', 'bindingKey'])(queueOpts);

      // connect to the queue
      connection.queue(queueName, qOpts, (q) => {

        // exchange name is not always required, so only add if present
        if (queueOpts.exchangeName) {
          q.bind(queueOpts.exchangeName, queueOpts.bindingKey || '#');
        }

        q.subscribe((msg) => {
          const logMsg = msg.data.toString();
          if (logMsg) {
            callback(isJson(logMsg) ? JSON.parse(logMsg) : logMsg);
          }
        });

        resolve();

      });

    });

  };

  /**
   * Disconnects the queue
   */
  const disconnect = () => {
    connection.removeAllListeners('end');
    connection.disconnect();
  };

  /**
   * Creates an exchange
   */
  const createExchange = (name, options) => {

    // default values
    const eOpts = Object.assign({}, {
      durable: true,
      autoDelete: false,
      type: 'direct'
    }, _pick(['type', 'durable', 'autoDelete'])(options || {}));

    return new Promise((resolve) => {
      connection.exchange(name, eOpts, () => {
        resolve();
      });
    });

  };

  return {
    subscribe,
    disconnect,
    createExchange
  };

};


/**
 * Initializes a new messaging queue.
 * @param {string} endpoint - rabbit mq connection endpoint
 * @param {number} timeout - timeout (in ms) to wait for the connection
 *  and then return an error. default is 3 mins.
 * @return {promise}
 *  if success - {object} - Queue
 *  if rejected - {error}
 */
const init = async (endpoint, timeout) => {

  // builds a connection
  const connection = await connect(endpoint, timeout);

  return queueWrapper(connection);

};


export default { init };
