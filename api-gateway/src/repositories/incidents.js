/**
 * @fileoverview Exposes calls to incidents service
 */

import client from '../lib/external-client';

// base client instance
const instance = client.init(process.env.INCIDENTS_SERVICE_URI);

/**
 * Initializes the repo
 */
const init = () => {

  const repo = {

    // return all incidents
    get: async () => {
      const inc = await instance.get('/incidents');
      return inc;
    }

  };

  return repo;

};

export default {
  init
};
