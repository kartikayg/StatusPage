/**
 * @fileoverview
 */

import striptags from 'striptags';


/**
 * HELPER METHODS
 */

/**
 * Sanitizes a string value. Rules:
 *   1. if the value is not string, it will be returned as is
 *   2. if empty string, a null is returned.
 *   3. otherwise strip tags and trim
 * @param {string} str - Value to sanitize
 * @return {mixed}
 */
const sanitizeString = (str) => {

  const type = typeof str;

  // if not a string ..
  if (type !== 'string') {
    return str;
  }

  // if empty, make it null
  if (str === '') {
    return null;
  }

  // strip tags (prevent xss) and trim
  return striptags(str).trim();

};

/**
 * Sanitizes string props within an object/array and returns a new object.
 * It doesn't modify the original object/arr and a new one is returned.
 * @param {object|array} obj - To sanitize
 * @return {object|array}
 */
const sanitizeObject = (obj) => {

  let sanitized;

  if (Array.isArray(obj)) {
    sanitized = [];
  }
  else if (typeof obj === 'object') {
    sanitized = {};
  }
  else {
    return obj;
  }

  // loop and sanitize each val
  Object.keys(obj).forEach((key) => {
    sanitized[key] = sanitizeVal(obj[key]); // eslint-disable-line no-use-before-define
  });

  return sanitized;

};


/**
 * Sanitizes value
 * @param {mixed} val
 * @return {val}
 */
const sanitizeVal = (val) => {

  if (val === null || val === undefined) {
    return val;
  }

  const type = typeof val;

  switch (type) {
    case 'object':
      return sanitizeObject(val);
    case 'string':
      return sanitizeString(val);
    default:
      return val;
  }

};


/**
 * MIDDLEWARE METHODS
 */

/**
 * Returns a middleware to sanitizes the request (body and query)
 * before it reaches the routes
 */
export const request = () => {
  return (req, res, next) => {
    req.sanitizedBody = sanitizeVal(req.body);
    req.sanitizedQuery = sanitizeVal(req.query);
    next();
  };
};

/**
 * Returns a middleware to sanitizes the req params
 * before it reaches the routes
 */
export const params = () => {
  return (req, res, next) => {
    req.sanitizedParams = sanitizeVal(req.params);
    next();
  };
};
