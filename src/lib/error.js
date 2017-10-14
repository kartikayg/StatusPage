/**
 * @fileoverview Class representing an API error.
 */

import httpStatus from 'http-status';


class APIError extends Error {

  /**
   * Creates an API error.
   * @param {string} message - Error message.
   * @param {number} status - HTTP status code of error.
   *   Defaults to 500.
   * @param {boolean} isPublic - Whether the error message can
   *   be returned as part of the API response or not. 
   */
  constructor(message, status = httpStatus.INTERNAL_SERVER_ERROR, isPublic = true) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    this.status = status;
    this.isPublic = isPublic;
    Error.captureStackTrace(this, this.constructor.name);
  }
}

export default APIError;
