/**
 * @fileoverview Exposes calls to components service
 */

import _pick from 'lodash/fp/pick';
import client from '../lib/external-client';

// base client instance
const instance = client.init(process.env.COMPONENTS_URI);

const init = () => {

  const repo = {

    // return all components and groups data combined
    get() {

      const cmpCall = instance.get('/components');
      const grpCall = instance.get('/component_groups');

      return Promise.all([cmpCall, grpCall]).then((components, groups) => {
        return [];
        // return [{
        //   id: 'test123',
        //   name: 'API'
        // }];
      });

    },

    /**
     * Creates a new component. It also supports creating a new group if needed.
     * @param {object} componentData
     * @return {Promise}
     *  on success, { component, newGroup (if created) }
     *  on failure, error
     */
    create: async (componentData) => {

      // base component data
      const cmpData = Object.assign(
        { sort_order: 1 },
        _pick(['name', 'description', 'active', 'status', 'group_id'])(componentData),
      );

      const resp = {};

      // a new group to create
      if (componentData.new_group_name) {

        // check if group exists with the name
        const existingGroups = await instance.get('/component_groups', {
          params: {
            name: componentData.new_group_name
          }
        });

        // already there ...
        if (existingGroups.length > 0) {
          cmpData.group_id = existingGroups[0].id;
        }
        // create a new group
        else {

          resp.newGroup = await instance.post('/component_groups', {
            component_group: { name: componentData.new_group_name, active: true }
          });

          cmpData.group_id = resp.newGroup.id;

        }

      }

      // create the group
      resp.component = await instance.post('/components', { component: cmpData });

      return resp;

    }

  };

  return repo;

};

export default {
  init
};
