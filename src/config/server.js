/**
 * Returns a joi schema for the server config
 * @param {object} joi
 * @returns {object}
 */
export const schema = (joi) => {
  return joi.object({
    PORT: joi.number()
      .required()
  });
};

/**
 * Extracts the server configuration
 * @param {object} env - object from joi validation on environment variables
 * @returns {object} 
 */
export const extract = (env = {}) => {
  return {
    server: {
      port: env.PORT
    }
  };
};
