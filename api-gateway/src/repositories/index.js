/**
 * @fileoverview Repositories index file
 */

import auth from './auth';
import components from './components';
import incidents from './incidents';
import notifications from './notifications';

const init = ({ redis }) => {

  // create all repos and return back an object
  const authRepo = auth.init(redis);
  const componentsRepo = components.init();
  const incidentsRepo = incidents.init();
  const notificationsRepo = notifications.init();

  return Object.assign({}, {
    auth: authRepo,
    components: componentsRepo,
    incidents: incidentsRepo,
    notifications: notificationsRepo
  });

};

export default { init };
