/**
 * @fileoverview Exposes calls to components service
 */

import client from '../lib/external-client';

// base client instance
const instance = client.init(process.env.COMPONENTS_URI);

const init = () => {

  const repo = {

    get() {

      const cmpCall = instance.get('/components');
      const grpCall = instance.get('/component_groups');

      return Promise.all([cmpCall, grpCall]).then((components, groups) => {
        console.log(components); // eslint-disable-line no-console
        console.log(groups); // eslint-disable-line no-console
      });

    }
  };

  return repo;

};

export default {
  init
};
