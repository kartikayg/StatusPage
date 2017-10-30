/**
 * Entry point for the microservice/
 */

// npm packges
import dotenv from 'dotenv';

// internal packages
import config from './config';
import {initWriters as initLogWriters} from './lib/logger';
import {connect as dbConnect} from './lib/db/mongo';
import dbsetup from './lib/db/setup';
import respository from './repositories';
import server from './server';

// process.on(stop, kill) {
//   close db;
// }

// process.on('uncaughtException', (err) => {
//   console.error('Unhandled Exception', err)
// })

// process.on('uncaughtRejection', (err, promise) => {
//   console.error('Unhandled Rejection', err)
// })

// log.fatal({ err }, 'uncaught exception')

//     process.nextTick(_ => process.exit(1))

// process.on('warning', (warning) => {
//   console.warn(warning.name);    // Print the warning name
//   console.warn(warning.message); // Print the warning message
//   console.warn(warning.stack);   // Print the stack trace
// });

/**
 * Initalizes the microservice. Here are the main steps in this function:
 *  Load config
 *  Init Db adapter
 *  Setup logger writers
 *  Load Repos
 */
const init = async () => {

  // load config
  dotenv.config();
  const conf = config.load(process.env);

  // load mongodb and setup tables
  const db = await dbConnect(conf.db);
  await dbsetup(db);

  // configure logger writers
  initLogWriters(conf.logger, { db });

  // load repositories
  const repos = respository.init(db);

  // start the server
  await server.start(conf.server, { repos });

};


init()
  .catch((e) => {
    console.error('Problem initializing the app'); // eslint-disable-line no-console
    console.error(e); // eslint-disable-line no-console
    process.exit(1);
  });
