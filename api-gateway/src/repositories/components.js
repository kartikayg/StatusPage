/**
 * @fileoverview Exposes calls to components service
 */

import _pick from 'lodash/fp/pick';
import client from '../lib/external-client';

// base client instance
const instance = client.init(process.env.COMPONENTS_URI);

/**
 * Creates a component group if not already existed.
 * @param {string} name
 * @return {Promise}
 *  on success, { id } - if group already exists
 *              { newGroup } - if a group is created
 */
const createGroup = async (name) => {

  // check if group exists with the name
  const existingGroups = await instance.get('/component_groups', {
    params: { name }
  });

  // already there ...
  if (existingGroups.length > 0) {
    return {
      id: existingGroups[0].id
    };
  }
  // create a new group


  const newGroup = await instance.post('/component_groups', {
    component_group: { name, active: true }
  });

  return {
    newGroup
  };


};

/**
 * Insert/update a component. It also supports creating a new group if needed.
 * @param {object} data
 * @param {string} id - component id for update
 * @return {Promise}
 *  on success, { component, newGroup (if created) }
 *  on failure, error
 */
const upsert = async (data, id) => {

  // base component data
  const cmpData = _pick(['name', 'description', 'active', 'status', 'group_id', 'sort_order'])(data);

  const resp = {};

  // a new group to create
  if (data.new_group_name) {

    const grp = await createGroup(data.new_group_name);

    // already there ...
    if (grp.id) {
      cmpData.group_id = grp.id;
    }
    // created a new group
    else {
      resp.newGroup = grp.newGroup;
      cmpData.group_id = resp.newGroup.id;
    }

  }

  // create the group
  if (!id) {
    resp.component = await instance.post('/components', { component: cmpData });
  }
  else {
    resp.component = await instance.patch(`/components/${id}`, { component: cmpData });
  }

  return resp;

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
     * Creates a new component. It also supports creating a new group if needed.
     * @param {object} data
     * @return {Promise}
     *  on success, { component, newGroup (if created) }
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
     *  on success, { component, newGroup (if created) }
     *  on failure, error
     */
    update: async (id, data) => {
      const resp = await upsert(data, id);
      return resp;
    }

  };

  return repo;

};

export default {
  init
};
