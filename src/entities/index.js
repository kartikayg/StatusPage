/**
 * @fileoverview Entry point to get specifics on different entities.
 *   Validate data against the entity's model.
 *   Generate unique id (sort of like a primary key) per entity.
 */

import Joi from 'joi';

import component from './component';
import componentgroup from './component-group';

import entityId from '../lib/entityid';

const entities = Object.create({ component, componentgroup });

/**
 * Validates data against an entity schema.
 * @param {string} entityType
 * @param {mixed} data - Data to validate
 * @return {Promise} Returns the validated value on success, exception otherwise.
 */ 
const schemaValidator = (entityType, data) => {

  return new Promise((resolve, reject) => {

    if (!data) {
      reject(new Error('Data to validate is not provided.'));
    }

    if (!entityType || !entities[entityType]) {
      reject(new Error('No schema avaiable for the entity type.'));
    }

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

  if (!entityType || !entities[entityType]) {
    throw new Error('No avaiable entry for the entity type.');
  }

  return entityId.generate(entities[entityType].prefix);

};


/**
 * Prototype for the entity object to export out
 */
const entity = {

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
  const e = Object.create(entity);
  e.type = t;

  exports[t] = e;

});
