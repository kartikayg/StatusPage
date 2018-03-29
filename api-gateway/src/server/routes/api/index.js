/**
 * @fileoverview Return the routes for this microservice (V1)
 */

import express from 'express';
import v1Routes from './v1';

/**
 * Return routes
 */
export default (options) => {

  const router = express.Router(); // eslint-disable-line new-cap

  // API routes
  router.use('/v1', v1Routes(options));

  return router;

};
