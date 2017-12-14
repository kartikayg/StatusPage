/**
 * @fileoverview Entry point to get specifics on different entities.
 *   Validate data against the entity's model.
 *   Generate unique id (sort of like a primary key) per entity.
 */

import Joi from 'joi';
import entityId from '../lib/entityid';

import subscriber from './subscriber';

const entities = { subscriber };

/**
 * Validates data against an entity schema.
 * @param {string} entityType
 * @param {object} data - Data to validate
 * @return {Promise}
 *   if fulfilled, {object} Returns the validated value
 *   if rejected {Error} error
 */
const schemaValidator = (entityType, data) => {

  return new Promise((resolve, reject) => {

    const {error, value} = Joi.validate(data, entities[entityType].schema);

    if (error) {
      reject(error);
    }
    else {
      resolve(value);
    }

  });

};

/**
 * Generates an entity id
 * @param {string} entity type
 * @return {string}
 */
const getEntityId = (entityType) => {
  return entityId(entities[entityType].prefix);
};


/**
 * Prototype for the entity object to export out
 */
const AbstractEntity = {

  // must be defined when creating object from this prototype
  type: undefined,

  validate(data) {
    return schemaValidator(this.type, data);
  },

  generateId() {
    return getEntityId(this.type);
  }

};


// now for each entity, export them out.
Object.keys(entities).forEach(t => {
  const e = Object.create(AbstractEntity);
  e.type = t;

  exports[t] = e;

});
