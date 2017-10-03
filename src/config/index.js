import * as server from './server';
import * as logger from './logger';
import * as db from './db';

const components = [server, logger, db];

/**
 * Loads config for all the components defined in this folder. Each component
 * should have a schema and extract fn to validate and load the config.
 * @param {object} envVars environment variables to load the config from
 * @return {object} config object
 */
const load = (envVars = {}) => {

  let config = {};

  // foreach component, validate against the schema and then extract the config
  components.forEach(c => {

    const {error, value: conf} = c.schema().validate(
      envVars, { allowUnknown: true, abortEarly: false }
    );

    if (error) {
      throw new Error(`Config validation error: ${error.message}`);
    }

    config = Object.assign(config, c.extract(conf));

  });

  return config;

};

export default Object.create({ load });
