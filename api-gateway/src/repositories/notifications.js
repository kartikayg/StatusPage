/**
 * @fileoverview Exposes calls to notification-service
 */

import client from '../lib/external-client';

// base client instance
const instance = client.init(process.env.NOTIFICATION_SERVICE_URI);

/**
 * Initializes the repo
 */
const init = () => {

  const repo = {

    // return all subscriptions
    getSubscriptions: async () => {
      const subscriptions = await instance.get('/subscriptions');
      return subscriptions;
    },

    // create a new incident
    createSubscription: async (data) => {
    },

    // removes an incident
    removeSubscription: async (id) => {
      const resp = await instance.remove(`/subscriptions/${id}`);
      return resp;
    }

  };

  return repo;

};

export default {
  init
};
