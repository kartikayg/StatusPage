/**
 * @fileoverview Exposes calls to components service
 */

import _pick from 'lodash/fp/pick';
import client from '../lib/external-client';

// base client instance
const instance = client.init(process.env.COMPONENTS_SERVICE_URI);

/**
 * Insert/update a component.
 * @param {object} data
 * @param {string} id - component id for update
 * @return {Promise}
 *  on success, { component object }
 *  on failure, error
 */
const upsert = async (data, id) => {

  // base component data
  const cmpData = _pick([
    'name',
    'description',
    'active',
    'status',
    'group_id',
    'sort_order'
  ])(data);

  let savedComponent = {};

  // create the group
  if (!id) {
    savedComponent = await instance.post('/components', { component: cmpData });
  }
  else {
    savedComponent = await instance.patch(`/components/${id}`, { component: cmpData });
  }

  return savedComponent;

};

/**
 * Initializes the repo
 */
const init = () => {

  const repo = {

    // return all components and groups data combined
    get: async () => {

      const cmpCall = instance.get('/components');
      const grpCall = instance.get('/component_groups');

      const res = await Promise.all([cmpCall, grpCall]);

      return {
        components: res[0],
        componentGroups: res[1]
      };

    },

    /**
     * Creates a new component.
     * @param {object} data
     * @return {Promise}
     *  on success, { component object }
     *  on failure, error
     */
    create: async (data) => {
      const resp = await upsert(data);
      return resp;
    },

    /**
     * Updates a component. It suppors partial data updates.
     * @param {string} id
     * @param {object} data
     * @return {Promise}
     *  on success, { component object }
     *  on failure, error
     */
    update: async (id, data) => {
      const resp = await upsert(data, id);
      return resp;
    },

    /**
     * Creates a new component group. If the group already exists
     * (based on the name), returns that object.
     * @param {string} name
     * @return {Promise}
     *  on success, { group object }
     */
    createGroup: async (name) => {

      // check if group exists with the name
      const existingGroups = await instance.get('/component_groups', {
        params: { name }
      });

      // already there ...
      if (existingGroups.length > 0) {
        return existingGroups[0];
      }

      // create a new group
      const newGroup = await instance.post('/component_groups', {
        component_group: { name, active: true }
      });

      return newGroup;

    }

  };

  return repo;

};

export default {
  init
};
