/**
 * @fileoverview Express Server setup
 */

import express from 'express';
import bodyParser from 'body-parser';
import compress from 'compression';
import methodOverride from 'method-override';
import cors from 'cors';
import helmet from 'helmet';
import httpStatus from 'http-status';

import routes from './routes';
import logger from '../lib/logger';
import logRequest from './middleware/log-request';

/**
 * Starts the express server
 * @param {object} conf - configuration for the server
 *  PORT
 *  NODE_ENV
 *  other properties for log request
 * @param {object} options
 *  repos
 *  messagingQueue
 */
const start = (conf, options) => {

  const app = express();

  // parse body params and attache them to req.body
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(compress());
  app.use(methodOverride());

  // secure apps by setting various HTTP headers
  app.use(helmet());

  // enable CORS - Cross Origin Resource Sharing
  app.use(cors());

  // log the call
  if (conf.ENABLE_HTTP_REQUEST_LOGS === true) {
    app.use(logRequest(options.messagingQueue));
  }

  // setup routes
  app.use('/api', routes(options.repos));

  // if there is an error at this point, it means it is unexpected like db
  // or some system error and should be logged.
  app.use((err, req, res, next) => {

    try {
      logger.error(err, {
        url: req.originalUrl || req.url,
        method: req.method,
        referrer: req.headers.referer || req.headers.referrer
      });
    }
    catch (e) {
      console.log(e); // eslint-disable-line no-console
    }

    return next(err);

  });

  // catch 404 and forward to error handler
  app.use((req, res, next) => {
    const err = new Error('API route not found.');
    err.httpStatus = httpStatus.NOT_FOUND;
    return next(err);
  });

  // unexpected error. return an error response
  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars

    const status = err.httpStatus || httpStatus.INTERNAL_SERVER_ERROR;

    const errRes = {};
    errRes.message = httpStatus[status];

    if (conf.NODE_ENV === 'development') {
      errRes.stack = err.stack;
    }

    res.status(status).json(errRes);

  });

  // listen on the port
  const server = app.listen(conf.PORT);

  app.close = function () { // eslint-disable-line func-names
    server.close();
  };

  return app;

};

export default { start };
