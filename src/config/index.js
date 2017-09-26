import server from './server';
import logger from './logger';

// load the conf for each component, combine and return
const load = envVars =>
  Object.assign(
    {},
    server.load(envVars),
    logger.load(envVars)
  );

export default Object.create({ load });
