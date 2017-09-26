import Joi from 'joi';

// env variables schema for server. use JOI to validate them and build the config
const schema = Joi.object({
  PORT: Joi.number()
    .required()
});

/**
 * Loads the config from env variables.
 * @param {object} envVars (process.env)
 * @return {object}
 */
const load = (envVars = {}) => {

  const {error, value: conf} = Joi.validate(
    envVars,
    schema,
    { allowUnknown: true, abortEarly: false }
  );

  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }

  return {
    server: {
      port: conf.PORT
    }
  };

};

export default Object.assign({}, { load });
