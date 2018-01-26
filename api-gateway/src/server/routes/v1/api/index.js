/**
 * @fileoverview API routes (V1)
 */

import express from 'express';

import componentRoutes from './components';
import authRoutes from './auth';

/**
 * Return routes
 */
export default (repos) => {

  const router = express.Router(); // eslint-disable-line new-cap

  // auth
  router.use(authRoutes(repos.auth));

  // add routes for external microservices
  router.use(componentRoutes(repos.components));

  return router;

};
