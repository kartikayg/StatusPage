/**
 * @fileoverview Middleware to log all HTTP requests coming
 * to the server. This uses a combination of winston and morgan.
 */

import morgan from 'morgan';
import morganJson from 'morgan-json';

// add token for request time
morgan.token('request-time', () => {
  return new Date();
});


/**
 * @return {function} express middleware
 */
export default (messagingQueue, immediate = false) => {

  function write(msg) {
    // publish log to the queue
    messagingQueue.publish(msg.trim(), 'logs', { routingKey: 'request' });
  }

  // what to log
  // use morgan-json
  const fmt = morganJson({
    method: ':method',
    url: ':url',
    ip: ':remote-addr',
    status: ':status',
    contentLength: ':res[content-length]',
    responseTime: ':response-time ms',
    serviceName: process.env.SERVICE_NAME,
    timestamp: ':request-time'
  });

  return morgan(fmt, { stream: { write }, immediate });

};
