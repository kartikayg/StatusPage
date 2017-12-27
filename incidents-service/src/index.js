/**
 * @fileoverview Entry point
 */

import app from './app';

// events on the process

process.on('uncaughtException', (err) => {
  console.error(`Uncaught exception: ${err}`); // eslint-disable-line no-console
});

process.on('unhandledRejection', (reason) => {
  console.error(`Unhandled rejection: ${reason}`); // eslint-disable-line no-console
});

process.on('SIGTERM', () => {
  app.shutdown();
  process.exit(0);
});

process.on('SIGINT', () => {
  app.shutdown();
  process.exit(0);
});

// start microservice
app.start()
  .catch((e) => {
    console.error('Problem initializing the app', e); // eslint-disable-line no-console
    process.exit(1);
  });
