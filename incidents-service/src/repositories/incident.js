/**
 * @fileoverview Repository to manage incidents
 */

import Joi from 'joi';

import cloneDeep from 'lodash/fp/cloneDeep';
import pick from 'lodash/fp/pick';
import omit from 'lodash/fp/omit';
import find from 'lodash/fp/find';

import {incident as incidentEntity, incidentUpdate as incidentUpdateEntity } from '../entities/index';
import {IdNotFoundError, UpdateNotAllowedError} from './errors';


/**
 * Validates an incident data before saving it.
 * @param {object} incidentObj - incident to validate
 * @param {object} existingIncident - existing incident. If this is
 *  passed, it means its an update operation and certain checks
 *  will be done.
 * @return {Promise}
 *  if fulfilled, {object} validated incident data
 *  if rejected, {Error} Error
 */
const validate = async (incidentObj, existingIncident = null) => {

  switch (incidentObj.type) {

    case 'realtime':
    case 'backfilled':
      // no specific validation
      break;

    case 'scheduled':

      break;


    default:
      throw new Error(`Invalid type: ${incidentObj.type}`);

  }

  // entity rules validation
  const validIncident = await incidentEntity.validate(incidentObj);
  return validIncident;

};

/**
 * Formats an incident object from the db. It removes
 * any data points specific to the db.
 * @param {object} incidentDb
 * @return {object}
 */
const format = (incidentDb) => {

  // remove _id from incident and updates

  const incident = omit(['_id'])(incidentDb);
  incident.updates = incident.updates.map(omit(['_id']));

  return incident;
};


/**
 * Builds an incident object based on the type and the data provided. If
 * an existing incident is passed, data will be merged.
 * @param {object} data
 * @param {object} existinIncident
 * @return {object}
 */
const buildIncidentObj = (data, existingIncident) => {

  const dataCopy = cloneDeep(data);

  // if updating ...
  if (existingIncident) {
    delete dataCopy.name;
    dataCopy.type = existingIncident.type;
  }

  switch (dataCopy.type) {

    case 'realtime':
    case 'backfilled':

      return Object.assign(
        cloneDeep(existingIncident || {}),
        pick(['name', 'type', 'components'])(dataCopy),
        pick(['type'])(existingIncident)
      );

    case 'scheduled':
      return existingIncident;

    default:
      throw new Error(`Invalid type: ${dataCopy.type}`);

  }

};


/**
 * Builds an incident-update object from the data provided.
 * @param {object} data
 * @return {object}
 */
const buildIncidentUpdateObj = (data) => {

  // pick properties from the data
  const obj = pick(['message', 'status', 'displayed_at', 'do_twitter_update', 'do_notify_subscribers'])(data);

  obj.id = incidentUpdateEntity.generateId();
  obj.created_at = new Date();
  obj.updated_at = new Date();

  return obj;

};


/**
 * Initializes the repo
 * @param {object} dao - database access object
 *  for incidents collection
 * @param {object} messagingQueue
 * @return {object}
 */
const init = (dao, messagingQueue) => {

  if (dao.name !== 'incidents') {
    throw new Error(`Invalid DAO passed to this repo. Passed dao name: ${dao.name}`);
  }

  // {object} repo object to return back
  const repo = {
    name: dao.name
  };

  /**
   * Loads a incident.
   * @param {string} id - incident id
   * @return {Promise}
   *  if fulfilled, {object} incident data
   *  if rejected, {Error} error
   */
  repo.load = async (id) => {

    const data = await dao.find({ id });

    if (data.length !== 1) {
      throw new IdNotFoundError(`Invalid Incident id passed: ${id}.`);
    }

    return format(data[0]);

  };

  /**
   * Returns a list of incidents based on filters
   * @param {object} filter. no field is required. allowed fields:
   *   type - incident type
   *   is_resolved
   *   component_id
   *   created_after - return incidents created on and after this date
   *   query - search against incident name and update messages
   * @return {Promise}
   *  if fulfilled, {array} array of incidents
   *  if rejected, {Error} error
   */
  repo.list = async (filter = {}) => {

    // validate passed filters
    const {error, value: validFilters} = Joi.validate(filter, {
      type: Joi.string(),
      is_resolved: Joi.boolean(),
      component_id: Joi.string(),
      created_after: Joi.date().iso(),
      query: Joi.string()
    }, { allowUnknown: true, abortEarly: false, stripUnknown: true });

    if (error) {
      throw error;
    }

    // build the predicate using sanitized filters

    const pred = {};

    Object.keys(validFilters).forEach(k => {

      switch (k) {
        case 'type':
        case 'is_resolved':
          pred[k] = validFilters[k];
          break;
        case 'component_id':
          pred.components = validFilters[k];
          break;
        case 'created_after':
          pred.created_at = { $gte: validFilters[k] };
          break;
        case 'query': {
          const regex = { $regex: new RegExp(validFilters[k]), $options: 'i' };
          pred.$or = [{ name: regex }, { 'updates.message': regex }];
          break;
        }
        default:
          break;
      }

    });

    // sort by id
    const sortBy = { _id: 1 };

    const incidents = await dao.find(pred, sortBy);
    return incidents.map(format);

  };

  /**
   * Creates a new incident.
   * @param {object} data
   * @return {Promise}
   *  if fulfilled, {object} component object
   *  if rejected, {Error} error
   */
  repo.create = async (data) => {

    // build incident-update obj
    const incUpdateObj = buildIncidentUpdateObj(data);

    // if backfilled type, there is only one update with resolved status
    if (data.type === 'backfilled') {
      incUpdateObj.status = 'resolved';
    }

    // build incident object
    const incidentObj = buildIncidentObj(data);

    incidentObj.id = incidentEntity.generateId();
    incidentObj.created_at = new Date();
    incidentObj.updated_at = new Date();

    incidentObj.updates = [incUpdateObj];

    // if the update status is resolved
    if (incUpdateObj.status === 'resolved') {
      incidentObj.is_resolved = true;
      incidentObj.resolved_at = new Date();
    }

    // validate
    const validIncident = await validate(incidentObj);

    // insert
    const insertIncident = await dao.insert(validIncident);

    // fire event
    messagingQueue.publish(validIncident, 'incidents', { routingKey: 'upsert' });

    return format(insertIncident);

  };

  /**
   * Updates an incident. Following rules are applied:
   *  1. If the incident is resolved, no more updates allowed.
   *  2. Name and type of the incident can't be updated. They will be ignored
   *     if passed.
   *  3. Only if a message or new status is passed, an incident-update will be created
   *     and publish on the messaging queue.
   * @param {string} id - incident id
   * @param {object} data - data for the update
   * @return {Promise}
   *  if fulfilled, {object} incident object
   *  if rejected, {Error} error
   */
  repo.update = async (id, data) => {

    const currentIncident = await repo.load(id);

    if (currentIncident.type === 'backfilled') {
      throw new UpdateNotAllowedError(`Incident ${id} is of type backfilled and can't have any updates.`);
    }

    let incUpdateObj;

    // if either of them are present, create a new incident-update
    if (data.status || data.message) {
      incUpdateObj = buildIncidentUpdateObj(data);
    }

    // if incident is already resolved, no more updates allowed to the incident meta object
    if (currentIncident.is_resolved && !incUpdateObj) {
      return format(currentIncident);
    }

    // object to save.
    const incidentToSave = buildIncidentObj(
      // if resolved, we won't be updating any fields, so passing an empty
      // object
      currentIncident.is_resolved ? {} : data,
      currentIncident
    );

    incidentToSave.updated_at = new Date();

    // if there is a new update
    if (incUpdateObj) {

      // if incident already resolved, then this it is always an update status
      if (incidentToSave.is_resolved) {
        incUpdateObj.status = 'update';
      }

      // resolving now ...
      else if (incUpdateObj.status === 'resolved') {
        incidentToSave.is_resolved = true;
        incidentToSave.resolved_at = new Date();
      }

      // add it to the array
      incidentToSave.updates.push(incUpdateObj);

    }

    // validate
    const validIncident = await validate(incidentToSave, currentIncident);

    // update
    await dao.update(validIncident, { id });

    // fire event
    messagingQueue.publish(validIncident, 'incidents', { routingKey: 'upsert' });

    return format(validIncident);

  };

  /**
   * Removes an incident.
   * @param {string} id - incident id
   * @return {Promise}
   *  if fulfilled, void
   *  if rejected, {Error} error
   */
  repo.remove = async (id) => {

    // remove the incident
    const cnt = await dao.remove({ id });

    if (cnt !== 1) {
      throw new IdNotFoundError(`Invalid incident id passed: ${id}.`);
    }

  };

  /**
   * Updates an incident update. The following fields are allowed to be updated
   *  1. displayed_at
   *  2. message
   * @param {string} incidentId
   * @param {string} incidentUpdateId
   * @param {object} data
   * @return {object} incident object
   */
  repo.changeIncidentUpdateEntry = async (incidentId, incidentUpdateId, data) => {

    // find the incident and clone it
    const currentIncident = await repo.load(incidentId);
    const incidentToSave = cloneDeep(currentIncident);

    // find update entry
    const currIncidentUpd = find(['id', incidentUpdateId])(incidentToSave.updates || []);
    if (!currIncidentUpd) {
      throw new IdNotFoundError(`No incident-update found for id: ${incidentUpdateId}.`);
    }

    // update incident-update. as its working from a cloned copy,
    // we can update it straight
    Object.assign(
      currIncidentUpd,
      pick(['displayed_at', 'message'])(data),
      { updated_at: new Date() }
    );

    incidentToSave.updated_at = new Date();

    // validate
    const validIncident = await validate(incidentToSave);

    // update
    await dao.update(validIncident, { incidentId });

    return format(validIncident);

  };

  return repo;

};

export default { init };
