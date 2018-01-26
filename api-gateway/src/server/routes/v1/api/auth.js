/**
 * @fileoverview Routes for managing auth
 */

import express from 'express';
import striptags from 'striptags';

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
  if (!str || str.trim() === '') {
    return null;
  }

  // strip tags (prevent xss) and trim
  return striptags(str).trim();

};


/**
 * @param {object} repo - auth repo
 */
export default (repo) => {

  const router = express.Router(); // eslint-disable-line new-cap

  // returns a jwt token based on the login information
  router.post('/login_token', (req, res, next) => {

    const username = sanitizeString(req.body.username);
    const password = sanitizeString(req.body.password);

    // login user and gen token
    repo.login(username, password).then(token => {
      res.json({
        token,
        message: 'Login successful'
      });
    }).catch(next);

  });


  return router;

};
