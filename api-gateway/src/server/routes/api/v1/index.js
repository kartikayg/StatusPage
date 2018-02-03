/**
 * @fileoverview API routes (V1)
 */

import express from 'express';

import authRoutes from './auth';
import componentRoutes from './components';
import incidentsRoutes from './incidents';
import authM from '../../../middleware/authenticate';

import thisPackage from '../../../../../package.json';

/**
 * Return routes
 */
export default (repos) => {

  const router = express.Router(); // eslint-disable-line new-cap

  /** GET /health-check - Check service health */
  router.get('/health-check', (req, res) => {
    res.json({
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

  return router;

};
