import Joi from 'joi';

// env variables schema for logger. use JOI to validate them and build the config
const schema = Joi.object({
  LOG_LEVEL: Joi.string()
    .only(['error', 'warn', 'info', 'debug'])
    .default('info'),
  LOGGING_ENABLED: Joi.boolean()
    .default(true)
});

/**
 * Loads the config from env variables.
 * @param {object} envVars (process.env)
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
    logger: {
      level: conf.LOG_LEVEL,
      isEnabled: conf.LOGGING_ENABLED
    }
  };
};

export default Object.assign({}, {load});
