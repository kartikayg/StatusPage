/**
 * @fileoverview Entry point to load all of the configuration.
 * The configuration is split by components to forego a single, growing config file.
 */

import * as server from './server';
import * as logger from './logger';
import * as db from './db';
import * as email from './email';

const components = {
  server, logger, db, email
};

// {object} application conf. this is populated using the load() fn
let appConf = {};

/**
 * Loads config for all the components defined in this folder. Each component
 * should have a schema variable to validate and load the config. This will also save
 * the config object locally.
 * @param {object} envVars - environment variables to load the config from
 * @return {object} config object
 */
const load = (envVars = {}) => {

  let config = {};

  // load for each component
  const loadCmp = (c) => {

    const {error, value} = components[c].schema.validate(
      envVars,
      { allowUnknown: true, abortEarly: false, stripUnknown: true }
    );

    if (error) {
      throw new Error(`Config validation error: ${error.message}`);
    }

    config = Object.assign(config, {[c]: value});

  };

  Object.keys(components).forEach(loadCmp);

  appConf = config;

  return appConf;

};

export default {

  load,

  // gets the loaded conf
  get conf() {
    // if conf is not loaded, exception is thrown
    if (Object.keys(appConf).length === 0) {
      throw new Error('Configuration is not loaded yet.');
    }
    return appConf;
  },

  // resets local conf
  reset() {
    appConf = {};
  }

};
