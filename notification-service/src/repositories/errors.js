/**
 * @fileoverview Error classes
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

/**
 * Class representing InvalidSubscriptionType.
 * @extends Error
 */
export class InvalidSubscriptionTypeError extends Error {

  /**
   * Creates an error.
   * @param {string} type - invalid type.
   */
  constructor(type) {
    super(`Invalid Subscription type: ${type}`);
    this.name = this.constructor.name;
  }
}

/**
 * Class representing DuplicatedSubscriptionError
 * @extends Error
 */
export class DuplicatedSubscriptionError extends Error {

  /**
   * Creates an error.
   * @param {string} message.
   */
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}
