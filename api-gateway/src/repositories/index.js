/**
 * @fileoverview
 */

import auth from './auth';

const init = ({ redis }) => {

  const authRepo = auth.init(redis);

  return Object.assign({}, {
    auth: authRepo
  });

};

export default { init };
