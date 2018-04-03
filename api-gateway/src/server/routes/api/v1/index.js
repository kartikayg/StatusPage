/**
 * @fileoverview API routes (V1)
 */

import express from 'express';

import authRoutes from './auth';
import componentRoutes from './components';
import incidentsRoutes from './incidents';
import subscriptionRoutes from './subscriptions';

import authM from '../../../middleware/authenticate';

import thisPackage from '../../../../../package.json';

/**
 * Return routes
 */
export default ({ repos, messagingQueue }) => {

  const router = express.Router(); // eslint-disable-line new-cap

  /** GET /health-check - Check service health */
  router.get('/health-check', (req, res) => {

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

  const authMiddleware = authM(repos.auth);

  // auth
  router.use(authRoutes(repos.auth));

  // add routes for external microservices
  router.use(componentRoutes(repos.components, authMiddleware));
  router.use(incidentsRoutes(repos.incidents, authMiddleware));
  router.use(subscriptionRoutes(repos.notifications, authMiddleware));

  // generic error handler. if there is any special case/override, it should be
  // handled by the route.
  router.use((err, req, res, next) => {

    if (err.httpStatus) {
      return res.status(err.httpStatus).json({ message: err.message });
    }

    return next(err);

  });

  return router;

};
