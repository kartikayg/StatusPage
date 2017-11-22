/**
 * @fileoverview Exposes functions for a messaging queue. This uses RabbitMq
 * as the library for the queue.
 */

import amqp from 'amqp';
import pick from 'lodash/fp/pick';

import logger from './logger';


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
 * functionality is needed.
 * @param {object} rabbitmq connection
 * @return {object}
 */
const queueWrapper = (connection) => {

  /**
   * Publishes to an exchange
   * @param {mixed} message - if a string is not passed, it will be
   *  JSON.stringify
   * @param {string} exchangeName - name of the exchange
   * @param {object} options
   *   type - exchange type
   *   durable
   *   autoDelete
   *   routingKey
   * @return {promise}
   */
  const publish = (message, exchangeName, options) => {

    // apply defaults to the queue options
    const eOpts = Object.assign({}, {
      durable: true,
      autoDelete: false,
      type: 'direct'
    }, pick(['type', 'durable', 'autoDelete'])(options || {}));

    return new Promise((resolve) => {

      // connects to an excahnge
      connection.exchange(exchangeName, eOpts, (ex) => {
        ex.on('open', () => {
          const pubMessage = (typeof message !== 'string' ? JSON.stringify(message) : message);
          ex.publish(options.routingKey, pubMessage);
          resolve();
        });
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

  return {
    publish,
    disconnect
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
