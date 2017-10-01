import httpStatus from 'http-status';

/**
 * Class representing an API error.
 * @extends Error
 */
class APIError extends Error {

  /**
   * Creates an API error.
   * @param {string} message - Error message.
   * @param {number} status - HTTP status code of error.
   */
  constructor(message, status = httpStatus.INTERNAL_SERVER_ERROR) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    this.status = status;
    Error.captureStackTrace(this, this.constructor.name);
  }
}

export default APIError;
