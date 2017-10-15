/**
 * @fileoverview Return the routes for this microservice
 */

import express from 'express';
import componentRoutes from './component';
import componentGroupRoutes from './component-group';

/**
 * Return routes
 */
export default (repos = {}) => {

  const router = express.Router(); // eslint-disable-line new-cap

  /** GET /health-check - Check service health */
  router.get('/health-check', (req, res) => {
    res.json('OK');
  });

  // mount component routes at /users
  router.use('/components', componentRoutes());

  // mount component-group routes
  router.use('/component-groups', componentGroupRoutes());

  return router;

};
