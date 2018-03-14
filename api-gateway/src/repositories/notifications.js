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

    /**
     * Return all subscriptions
     * @return {promise}
     *  on success, {array} array of subscription objects
     *  on error, {error}
     */
    getSubscriptions: async () => {
      const subscriptions = await instance.get('/subscriptions');
      return subscriptions;
    },

    /**
     * Returns a single subscriptions
     * @param {string} id
     * @return {promise}
     *  on success, {object} subscription objects
     *  on error, {error}
     */
    getSubscription: async (id) => {
      const subscription = await instance.get(`/subscriptions/${id}`);
      return subscription;
    },

    /**
     * Creates a new subscription
     * @param {object} data
     * @return {promise}
     *  on success, {object} - subscription object
     *  on error {error}
     */
    createSubscription: async (data) => {
      const subscriptipn = await instance.post('/subscriptions', { subscription: data });
      return subscriptipn;
    },

    /**
     * Removes a subscription
     * @param {string} id
     * @return {promise}
     */
    removeSubscription: async (id) => {
      const resp = await instance.remove(`/subscriptions/${id}`);
      return resp;
    },

    /**
     * Sends confirm subscription email
     * @param {string} id
     * @return {promise}
     */
    sendSubscriptionConfirmationLink: async (id) => {
      const resp = await instance.get(`/subscriptions/${id}/send_confirmation_link`);
      return resp;
    },

    /**
     * Mark subscription confirm.
     * @param {string} id
     * @return {promise}
     */
    markSubscriptionConfirmed: async (id) => {
      const resp = await instance.patch(`/subscriptions/${id}/confirm`);
      return resp;
    },

    /**
     * Manages components for a subscription
     * @param {string} id
     * @param {object} components
     * @return {promise}
     *  on success, {object} - subscription object
     *  on error {error}
     */
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
