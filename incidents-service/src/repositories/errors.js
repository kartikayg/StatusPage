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


/**
 * Class representing InvalidIncidentTypeError.
 * @extends Error
 */
export class InvalidIncidentTypeError extends Error {

  /**
   * Creates an error.
   * @param {string} type - invalid type.
   */
  constructor(type) {
    super(`Invalid Incident type: ${type}`);
    this.name = this.constructor.name;
  }
}


/**
 * Class representing UpdateNotAllowedError.
 * @extends Error
 */
export class UpdateNotAllowedError extends Error {

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
 * Class representing InvalidDateError.
 * @extends Error
 */
export class InvalidDateError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Class representing InvalidIncidentStatusError.
 * @extends Error
 */
export class InvalidIncidentStatusError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}
