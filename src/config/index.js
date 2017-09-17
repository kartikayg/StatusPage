import server from './server';

// load the conf for each component, combine and return
const load = envVars =>
  Object.assign(
    {},
    server.load(envVars)
  );

export default Object.assign({}, { load });
