/**
 * @fileoverview Return the routes for this microservice
 */

import express from 'express';
import httpStatus from 'http-status';

import {request as sanitizeRequest} from '../middleware/sanitize';
import componentRoutes from './component';
import componentGroupRoutes from './component-group';

import thisPackage from '../../../package.json';

/**
 * Return routes
 */
export default ({ repos, db, messagingQueue }) => {

  const router = express.Router(); // eslint-disable-line new-cap

  // sanitize req data
  router.use(sanitizeRequest());

  /** GET /health-check - Check service health */
  router.get('/health-check', (req, res) => {

    if (db.isActive() === false) {
      return res.status(500).json({ message: 'DB is not available.' });
    }

    // if (messagingQueue.isActive() === false) {
    //   return res.status(500).json({ message: 'Messaging queue is not available.' });
    // }

    return res.json({
      status: 'RUNNING',
      name: thisPackage.name,
      version: thisPackage.version,
      environment: process.env.NODE_ENV
    });

  });

  // mount component routes at /components
  router.use('/components', componentRoutes(repos.component));

  // mount group routes at /component_groups
  router.use('/component_groups', componentGroupRoutes(repos.componentGroup));

  // generic error handler. if there is any special case/override, it should be
  // handled by the route.
  router.use((err, req, res, next) => {

    switch (err.name) {

      // data input error
      case 'ValidationError':
      case 'IdNotFoundError':
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
