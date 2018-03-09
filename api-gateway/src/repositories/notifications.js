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

    // returns a single subscription
    getSubscription: async (id) => {
      const subscription = await instance.get(`/subscriptions/${id}`);
      return subscription;
    },

    // create a new subscription
    createSubscription: async (data) => {
      const subscriptipn = await instance.post('/subscriptions', { subscription: data });
      return subscriptipn;
    },

    // removes a subscription
    removeSubscription: async (id) => {
      const resp = await instance.remove(`/subscriptions/${id}`);
      return resp;
    },

    // send subscription confirm link email
    sendSubscriptionConfirmationLink: async (id) => {
      const resp = await instance.get(`/subscriptions/${id}/send_confirmation_link`);
      return resp;
    },

    // manages subscription components
    manageSubscriptionComponents: async (id, components) => {
      const resp = await instance.patch(`/subscriptions/${id}/manage_components`, { components });
      return resp;
    }

  };

  return repo;

};

export default {
  init
};
