/**
 * @fileoverview
 */

/**
 * Class representing IdNotFoundError.
 * @extends Error
 */
export class IdNotFoundError extends Error {

  /**
   * Creates an error.
   * @param {string} message - Error message.
   */
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}
