/**
 * @fileoverview Repository to manage authentication related functionality
 */

import jwt from 'jsonwebtoken';
import _pick from 'lodash/fp/pick';

import config from '../config';
import { InvalidCredentialsError } from './error';

const APP_USER_TYPE = 'APP';
const API_USER_TYPE = 'API';
const API_TOKEN_KEY = 'api-token';

/**
 * Initializes the repo
 * @param {object} redis - redis connection
 * @return {object}
 */
const init = (redis) => {

  const authConf = config.conf.auth;

  // repo object
  const repo = {};

  /**
   * Generates token for an user.
   * @param {object} user
   * @return {string}
   */
  const generateToken = (user) => {

    const { type } = user;

    // by default, expire it right away
    let expiresIn = 0;

    // 3 days for APP token
    if (type === APP_USER_TYPE) {
      expiresIn = '3d';
    }
    // 1 year for API token
    else if (type === API_USER_TYPE) {
      expiresIn = '1y';
    }

    return jwt.sign(user, authConf.JWT_SECRET_KEY, { expiresIn });

  };

  /**
   * Login and generate a token for an app user
   * @param {string} username
   * @param {string} password
   * @return {string}
   */
  repo.login = async (username, password) => {

    // check username and password
    if (username !== authConf.ADMIN_USERNAME || password !== authConf.ADMIN_PASSWORD) {
      throw new InvalidCredentialsError('Invalid username/password passed.');
    }

    return generateToken({
      username,
      type: APP_USER_TYPE,
      created: (new Date()).toISOString()
    });

  };

  /**
   * Verifies a token.
   * @param {string} token
   * @return {Promise}
   */
  repo.verifyToken = async (token) => {

    let user;

    try {
      user = jwt.verify(token, authConf.JWT_SECRET_KEY);
    }
    catch (e) {
      return false;
    }

    // for api token, verify that it is the current one
    if (user.type === API_USER_TYPE) {
      const apiToken = await repo.getApiToken(false);
      if (apiToken !== token) {
        return false;
      }
    }

    return _pick(['username', 'type', 'created'])(user);

  };

  /**
   * Generates a new token for the API. Any existing API token
   * will stop working.
   * @return {Promise}
   *  on success, {string} token
   *  on failure, error
   */
  repo.generateApiToken = async () => {

    const newToken = generateToken({
      username: 'api-user',
      type: API_USER_TYPE
    });

    // save the api token in redis. there is only
    // one token allowed for api
    await redis.set(API_TOKEN_KEY, newToken);

    return newToken;

  };

  /**
   * Gets the current api token. If nothing existing, it
   * will generate one based on the parameter.
   * @param {boolean} generate
   * @return {Promise}
   *  on success, {string} token
   *  on failure, error
   */
  repo.getApiToken = async (generate = true) => {

    let token = await redis.get(API_TOKEN_KEY);

    if (!token && generate === true) {
      token = await repo.generateApiToken();
    }

    return token;

  };

  return repo;

};

export default {
  init
};
