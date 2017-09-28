import Joi from 'joi';

import * as server from './server';
import * as logger from './logger';
import * as db from './db';

const components = [server, logger, db];

const load = (envVars = {}) => {

  let config = {};

  // foreach component, validate against the schema and then extract the config
  components.forEach((c) => {

    const {error, value: conf} = c.schema(Joi).validate(
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
