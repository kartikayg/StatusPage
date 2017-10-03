/**
 * @fileoverview This module is used to generate IDs for entities
 * used in this microservice.
 */

import shortid from 'shortid';

/**
 * Generates an alphanumeric ID. 
 * @param {?string} entityPrefix - Prefix to prepend to the ID. If its passed,
 *  the resulting ID would be {prefix}-{generated-id}, otherwise it is {generated-id}
 * @return {string}
 */
const generate = (entityPrefix = '') => {
  const id = shortid.generate();
  return entityPrefix ? `${entityPrefix}-${id}` : id;
};

export default Object.create({ generate });
