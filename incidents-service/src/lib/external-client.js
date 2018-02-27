/**
 * @fileoverview Base module to allow to make ajax calls to outer services
 * This uses axios as the package to make calls.
 */

import axios from 'axios';

// default timeout for the calls
const DEFAULT_TIMEOUT = 5000;

/**
 * Initialize a base client for the given base url
 * @param {string}
 * @return {object}
 */
const init = (baseUrl) => {

  // Create an instance using the config defaults
  const instance = axios.create({
    timeout: DEFAULT_TIMEOUT,
    baseURL: baseUrl
  });

  /**
   * Main method to execute the http calls using axios.
   * @param {string} url
   * @param {string} method
   * @param {object} opts. See axios docs: https://github.com/axios/axios
   * @return {Promise}
   */
  const execute = async (url, method, opts = {}) => {

    try {
      // make the call and return the response data
      const resp = await instance({ url, method, ...opts });
      return resp.data;
    }
    catch (e) {

      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (e.response) {

        const resp = e.response.data;
        let message = '';

        // its json response
        if (typeof resp === 'object') {
          message = resp.message || JSON.stringify(resp);
        }
        else {
          message = JSON.stringify(resp);
        }

        const err = new Error(message);
        err.httpStatus = e.response.status;
        throw err;
      }

      throw e;

    }

  };

  /**
   * Executes get call
   */
  const get = (url, opts = {}) => {
    return execute(url, 'get', opts);
  };

  /**
   * Executes post call
   */
  const post = (url, data, opts = {}) => {
    return execute(url, 'post', { data, ...opts });
  };

  /**
   * Executes post call
   */
  const patch = (url, data, opts = {}) => {
    return execute(url, 'patch', { data, ...opts });
  };

  return {
    get,
    post,
    patch
  };

};

export default {
  init
};
