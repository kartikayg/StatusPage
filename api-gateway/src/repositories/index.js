/**
 * @fileoverview
 */

import auth from './auth';
import components from './components';
import incidents from './incidents';

const init = ({ redis }) => {

  const authRepo = auth.init(redis);
  const componentsRepo = components.init();
  const incidentsRepo = incidents.init();

  return Object.assign({}, {
    auth: authRepo,
    components: componentsRepo,
    incidents: incidentsRepo
  });

};

export default { init };
