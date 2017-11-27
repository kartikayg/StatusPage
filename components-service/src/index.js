/**
 * @fileoverview Entry point
 */

import * as app from './app';

// events on the process

process.on('exit', (code) => {
  console.log(`About to exit with code: ${code}`); // eslint-disable-line no-console
  app.shutdown();
});

process.on('uncaughtException', (err) => {
  console.error(`Uncaught exception: ${err}`); // eslint-disable-line no-console
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(`Unhandled rejection: ${reason}`); // eslint-disable-line no-console
  process.exit(1);
});

process.on('SIGTERM', () => {
  process.exit(1);
});
process.on('SIGINT', () => {
  process.exit(1);
});


// start microservice
app.start()
  .catch((e) => {
    console.error('Problem initializing the app', e); // eslint-disable-line no-console
    process.exit(1);
  });
