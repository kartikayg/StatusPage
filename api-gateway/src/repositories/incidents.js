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
      const incidents = await instance.get('/incidents');
      return incidents;
    },

    create: async (data) => {
      const incident = await instance.post('/incidents', { incident: data });
      return incident;
    }

  };

  return repo;

};

export default {
  init
};
