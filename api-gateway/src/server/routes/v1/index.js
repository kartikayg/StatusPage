/**
 * @fileoverview Return the routes for this microservice (V1)
 */

import express from 'express';
import httpStatus from 'http-status';
import striptags from 'striptags';

import apiRoutes from './api';

import thisPackage from '../../../../package.json';

/**
 * Sanitizes a string value. Rules:
 *   1. if the value is not string, it will be returned as is
 *   2. if empty string, a null is returned.
 *   3. otherwise strip tags and trim
 * @param {string} str - Value to sanitize
 * @return {mixed}
 */
const sanitizeString = (str) => {

  // if empty, make it null
  if (str.trim() === '') {
    return null;
  }

  // strip tags (prevent xss) and trim
  return striptags(str).trim();

};

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


  /** POST auth/login - Logs the user in and returns a token */
  router.post('auth/login', (req, res, next) => {

    const username = sanitizeString(req.body.username);
    const password = sanitizeString(req.body.password);

    // login user and gen token
    repos.auth.login(username, password).then(token => {
      res.json({
        token,
        message: 'Login successful'
      });
    }).catch(next);

  });

  // API routes
  router.use('/api', apiRoutes(repos));


  // generic error handler. if there is any special case/override, it should be
  // handled by the route.
  router.use((err, req, res, next) => {

    switch (err.name) {

      // data input error
      case 'InvalidCredentialsError':
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
