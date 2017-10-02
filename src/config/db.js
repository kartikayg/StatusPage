/**
 * Returns a joi schema for the logger config
 * @param {object} joi
 * @returns {object}
 */
export const schema = (joi) => {
  return joi.object({
    MONGO_ENDPOINT: joi.string()
      .uri({ scheme: ['mongodb'] })
      .required()
  });
};

/**
 * Extracts the configuration
 * @param {object} env - object from joi validation on environment variables
 * @returns {object} 
 */
export const extract = (env = {}) => {
  return {
    db: {
      mongo_url: env.MONGO_ENDPOINT
    }
  };
};
