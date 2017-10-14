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

import logRequest from './log-request';
import {error as logError} from '../lib/logger';

/**
 * Starts the express server
 * @param {object} conf
 */
const start = (conf = {}) => {

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
  //app.use(logRequest(conf.LOG_HTTP_REQUEST_WRITER));


  // setup routes
  logError('test logging');


  // if error is not an instanceOf APIError, convert it.
  app.use((err, req, res, next) => {

  });

  // catch 404 and forward to error handler
  app.use((req, res, next) => {
    const err = new APIError('API route not found', httpStatus.NOT_FOUND);
    return next(err);
  });

  // error handler
  app.use((err, req, res, next) => {
    
    logError(err);

    res.status(err.status || 500).json({
      message: err.isPublic ? err.message : httpStatus[err.status],
      stack: config.NODE_ENV === 'development' ? err.stack : {}
    });

  });

};

export default Object.create({ start });
