/**
 * @fileoverview
 */

import * as app from './app';

// start microservice
app.start()
  .catch((e) => {
    console.error('Problem initializing the app'); // eslint-disable-line no-console
    console.error(e); // eslint-disable-line no-console
    process.exit(1);
  });
