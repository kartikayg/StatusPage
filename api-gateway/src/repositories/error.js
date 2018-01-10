/**
 * @fileoverview
 */

/**
 * Class representing InvalidCredentialsError.
 * @extends Error
 */
export class InvalidCredentialsError extends Error {

  /**
   * Creates an error.
   * @param {string} message - Error message.
   */
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}
