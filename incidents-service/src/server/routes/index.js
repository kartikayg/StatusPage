/**
 * @fileoverview Return the routes for this microservice
 */

import express from 'express';
import httpStatus from 'http-status';

import {request as sanitizeRequest} from '../middleware/sanitize';
import incidentRoutes from './incident';

import thisPackage from '../../../package.json';

/**
 * Return routes
 */
export default (repos = {}) => {

  const router = express.Router(); // eslint-disable-line new-cap

  // sanitize req data
  router.use(sanitizeRequest());

  /** GET /health-check - Check service health */
  router.get('/health-check', (req, res) => {
    res.json({
      status: 'RUNNING',
      name: thisPackage.name,
      version: thisPackage.version,
      environment: process.env.NODE_ENV
    });
  });

  // mount incident routes at /incidents
  router.use('/incidents', incidentRoutes(repos.incident));

  // generic error handler. if there is any special case/override, it should be
  // handled by the route.
  router.use((err, req, res, next) => {

    switch (err.name) {

      // data input error
      case 'ValidationError':
      case 'IdNotFoundError':
      case 'UpdateNotAllowedError':
        res.status(httpStatus.UNPROCESSABLE_ENTITY).json({ message: err.message });
        break;

      // db/unknown errors.
      default:
        next(err);
        break;
    }

  });

  return router;

};
