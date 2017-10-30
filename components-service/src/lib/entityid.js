/**
 * @fileoverview This module is used to generate IDs for entities
 * used in this microservice.
 */

import uniqid from 'uniqid';

/**
 * Generates an alphanumeric ID. 
 * @param {?string} entityPrefix - Prefix to prepend to the ID. If its passed,
 *  the resulting ID would be {prefix}-{generated-id}, otherwise it is {generated-id}
 * @return {string}
 */
export default (entityPrefix = '') => {
  return uniqid.process(entityPrefix);
};
