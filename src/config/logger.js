/**
 * Returns a joi schema for the logger config
 * @param {object} joi
 * @returns {object}
 */
export const schema = (joi) => {
  return joi.object({
    LOG_LEVEL: joi.string()
      .only(['error', 'warn', 'info', 'debug'])
      .default('info'),
    LOGGING_ENABLED: joi.boolean()
      .default(true)
  });
};

/**
 * Extracts the logger configuration
 * @param {object} env - object from joi validation on environment variables
 * @returns {object} 
 */
export const extract = (env = {}) => {
  return {
    logger: {
      level: env.LOG_LEVEL,
      isEnabled: env.LOGGING_ENABLED
    }
  };
};
