/**
 * @fileoverview Adds functionality to do ajax call to the backend
 * and api-gateway using axios.
 */

import axios from 'axios';

// default timeout in ms
const CALL_TIMEOUT = 5000;

/**
 * Main method to execute the calls using axios.
 * @param {string} url
 * @param {string} method
 * @param {object} opts. See axios docs: https://github.com/axios/axios
 * @return {Promise}
 */
const execute = async (url, method, opts = {}, instance = null) => {

  let axiosInstance = instance;

  if (!instance) {
    axiosInstance = axios.create({
      timeout: CALL_TIMEOUT
    });
  }

  try {
    const resp = await axiosInstance({ url, method, ...opts });
    return resp.data;
  }
  catch (e) {

    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    if (e.response) {

      // not authenticated, redirect to login, for UI only
      if (e.response.status === 401 && __CLIENT__ === true) { // eslint-disable-line no-undef
        location.href = '/login'; // eslint-disable-line
      }

      // otherwise grab information from the response property
      const resp = e.response.data;
      let message = '';

      // its json response
      if (typeof resp === 'object' && resp.message) {
        message = resp.message; // eslint-disable-line prefer-destructuring
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
 * Wrapper object to provide http calls to the api gaetway
 */
const apiGateway = (function () {

  // Create an axios instance
  const instance = axios.create({
    timeout: CALL_TIMEOUT,
    baseURL: `${process.env.API_GATEWAY_URI}/v1/api`
  });

  return {

    get(url, opts = {}) {
      return execute(url, 'get', opts, instance);
    },

    post(url, data, opts = {}) {
      return execute(url, 'post', { data, ...opts }, instance);
    }

  };

}());

export { execute, apiGateway };
