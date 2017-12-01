/**
 * @fileoverview Repository to manage incidents
 */

import cloneDeep from 'lodash/fp/cloneDeep';
import pick from 'lodash/fp/pick';
import omit from 'lodash/fp/omit';

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
      throw new Error(`Invalid type: ${data.type}`);

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
  }

  switch (data.type) {

    case 'realtime':
    case 'backfilled':

      return Object.assign(
        cloneDeep(existingIncident || {}),
        pick(['name', 'type', 'components'])(dataCopy),
        pick(['type'])(existingIncident)
      );

    case 'scheduled':

      break;


    default:
      throw new Error(`Invalid type: ${data.type}`);

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
  obj.created_at = (new Date()).toISOString();
  obj.updated_at = (new Date()).toISOString();

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

  // /**
  //  * Returns a list of components based on query
  //  * @param {object} filter
  //  *   fields: active, status, group_id
  //  * @return {Promise}
  //  *  if fulfilled, {array} array of components
  //  *  if rejected, {Error} error
  //  */
  // repo.list = async (filter) => {

  //   // sort by group and then the sort order and then id. in
  //   // case sort_order is same, it will order by creation (_id)
  //   const sortBy = { group_id: 1, sort_order: 1, _id: 1 };

  //   // build predicate
  //   const pred = pick(['active', 'group_id', 'status'])(filter);

  //   const components = await dao.find(pred, sortBy);
  //   return components.map(format);

  // };

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
    incidentObj.created_at = (new Date()).toISOString();
    incidentObj.updated_at = (new Date()).toISOString();

    incidentObj.updates = [incUpdateObj];

    // if the update status is resolved
    if (incUpdateObj.status === 'resolved') {
      incidentObj.is_resolved = true;
      incidentObj.resolved_at = (new Date()).toISOString();
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

    if (currentIncident.is_resolved) {
      throw new UpdateNotAllowedError(`Incident ${id} is resolved and can't be updated`);
    }

    let incUpdateObj;

    // if either of them are present, create a new update
    if (data.status || data.message) {
      incUpdateObj = buildIncidentUpdateObj(data);
    }

    // object to save.
    const dataCopy = Object.assign(cloneDeep(data), { type: currentIncident.type });

    const incidentToSave = buildIncidentObj(dataCopy, currentIncident);
    incidentToSave.updated_at = (new Date()).toISOString();

    // if there is a new update
    if (incUpdateObj) {

      // resolving now ...
      if (incUpdateObj.status === 'resolved') {
        incidentToSave.is_resolved = true;
        incidentToSave.resolved_at = (new Date()).toISOString();
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
   * Adds a postmortem message to an incident. Following rules are applied:
   *  1. This can't be added to a backfilled incident type
   *  2. A postmortem can only be added once the incident is resolved
   * @param {string} id - incident id
   * @param {object} data for the message
   * @return {Promise}
   *  if fulfilled, {object} incident object
   *  if rejected, {Error} error
   */
  repo.addPostmortemMessage = async (id, data) => {

    const currentIncident = await repo.load(id);

    if (!currentIncident.is_resolved) {
      throw new UpdateNotAllowedError(`Incident ${id} is not resolved and can't have any postmortem updates.`);
    }

    if (currentIncident.type === 'backfilled') {
      throw new UpdateNotAllowedError(`Incident ${id} is of type backfilled and can't have any postmortem updates.`);
    }

    // build incident-update obj
    const incUpdateObj = buildIncidentUpdateObj(data);
    incUpdateObj.status = 'postmortem';

    const incidentToSave = Object.assign(cloneDeep(currentIncident), {
      updated_at: (new Date()).toISOString()
    });

    incidentToSave.updates.push(incUpdateObj);

    // validate
    const validIncident = await validate(incidentToSave);

    // update
    await dao.update(validIncident, { id });

    // fire event
    messagingQueue.publish(validIncident, 'incidents', { routingKey: 'upsert' });

    return format(validIncident);

  };

  return repo;

};

export default { init };
