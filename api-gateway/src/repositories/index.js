/**
 * @fileoverview
 */

import auth from './auth';
import components from './components';

const init = ({ redis }) => {

  const authRepo = auth.init(redis);
  const componentsRepo = components.init();

  return Object.assign({}, {
    auth: authRepo,
    components: componentsRepo
  });

};

export default { init };
