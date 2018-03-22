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
const executeCall = async (url, method, opts = {}, instance = null) => {

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
 * Wrapper object to provide http calls to the api gateway
 */
const apiGateway = (function () {

  const serverInstance = axios.create({
    timeout: CALL_TIMEOUT,
    baseURL: `${process.env.API_GATEWAY_URI}/api/v1`
  });

  const clientInstance = axios.create({
    timeout: CALL_TIMEOUT,
    baseURL: `${process.env.API_GATEWAY_HTTP_URI}/api/v1`
  });

  const getInstance = () => {

    if (__SERVER__ === true) { // eslint-disable-line no-undef
      return serverInstance;
    }

    return clientInstance;

  };

  let authToken;

  return {

    setAuthToken(token) {
      authToken = token;
    },

    execute(url, method, opts = {}) {

      const executeOpts = { ...opts };

      if (authToken) {
        const headers = opts.headers || {};
        headers.Authorization = `JWT ${authToken}`;
        executeOpts.headers = headers;
      }

      return executeCall(url, method, executeOpts, getInstance());

    },

    get(url, opts = {}) {
      return this.execute(url, 'get', opts);
    },

    post(url, data, opts = {}) {
      return this.execute(url, 'post', { data, ...opts });
    },

    patch(url, data, opts = {}) {
      return this.execute(url, 'patch', { data, ...opts });
    },

    remove(url, opts = {}) {
      return this.execute(url, 'delete', opts);
    }

  };

}());

export { executeCall, apiGateway };
