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

import {error as logError} from '../lib/logger';
import APIError from '../lib/error';

/**
 * Starts the express server
 * @param {object} conf
 */
const start = (conf = {}, options = {}) => {

  return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars

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
    // app.use(logRequest(conf.LOG_HTTP_REQUEST_WRITER));


    // setup routes


    // if error is not an instanceOf APIError, convert it.
    app.use((err, req, res, next) => {

      if (!(err instanceof APIError)) {
        const apiError = new APIError(err.message, httpStatus.INTERNAL_SERVER_ERROR, false);
        return next(apiError);
      }

      return next(err);

    });

    // log error
    app.use((err, req, res, next) => {

      try {
        logError(err);
      }
      catch (e) {
        console.error(e); // eslint-disable-line no-console
      }

      return next(err);

    });

    // catch 404 and forward to error handler
    app.use((req, res, next) => {
      const err = new APIError('API route not found', httpStatus.NOT_FOUND);
      return next(err);
    });

    // return an error response
    app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars

      res.status(err.status || 500).json({
        message: err.isPublic ? err.message : httpStatus[err.status],
        stack: conf.NODE_ENV === 'development' ? err.stack : {}
      });

    });

    const server = app.listen(conf.PORT, () => {
      return resolve(server);
    });

  });

};

export default Object.create({ start });
