/**
 * @fileoverview Exposes calls to incidents service
 */

import client from '../lib/external-client';

// base client instance
const instance = client.init(process.env.INCIDENTS_SERVICE_URI);

// default message per status
const defaultMessages = {
  investigating: 'We are currently investigating this issue.',
  in_progress: 'The scheduled maintenance is in progress.',
  identified: 'The issue has been identified and a fix is being implemented.',
  verifying: 'We are verifying the scheduled maintenance.',
  monitoring: 'A fix has been implemented and we are monitoring the results.',
  resolved: 'This incident has been resolved.',
  cancelled: 'This incident has been cancelled.'
};

/**
 * Initializes the repo
 */
const init = () => {

  const repo = {

    /**
     * Returns all incidents
     */
    get: async () => {
      const incidents = await instance.get('/incidents');
      return incidents;
    },

    /**
     * Returns a single incident. If no incident is found, an
     * empty object is returned
     * @param {string} id
     * @return {promise}
     *  on success, {object} incident object
     *  on error {error}
     */
    getOne: async (id) => {
      try {
        const incident = await instance.get(`/incidents/${id}`);
        return incident;
      }
      catch (e) {
        // not found
        if (e.httpStatus === 422) {
          return {};
        }

        throw e;

      }

    },

    /**
     * Creates a new incident
     * @param {object} data
     * @return {promise}
     *  on success, {object} - incident object
     *  on error {error}
     */
    create: async (data) => {
      const incident = await instance.post('/incidents', { incident: data });
      return incident;
    },

    /**
     * Updates an incident
     * @param {string} id
     * @param {object} data
     * @return {promise}
     *  on success, {object} - incident object
     *  on error {error}
     */
    update: async (id, data) => {

      const toPost = { ...data };

      // if status posted, but no message, add a
      // default message if present
      if (data.status && !data.message && defaultMessages[data.status]) {
        toPost.message = defaultMessages[data.status];
      }

      const incident = await instance.patch(`/incidents/${id}`, { incident: toPost });
      return incident;

    },

    /**
     * Removes an incident
     * @param {string} id
     * @return {promise}
     */
    remove: async (id) => {
      const resp = await instance.remove(`/incidents/${id}`);
      return resp;
    },

    /**
     * Changes an incident-update entry.
     * @param {string} incidentId
     * @param {string} updateId
     * @param {object} data
     * @return {promise}
     */
    changeIncidentUpdate: async (incidentId, updateId, data) => {
      const url = `/incidents/${incidentId}/incident_updates/${updateId}`;
      const incident = await instance.patch(url, { update: data });
      return incident;
    }

  };

  return repo;

};

export default {
  init
};
