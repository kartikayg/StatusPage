/**
 * @fileoverview Repository to manage incidents
 */

import Joi from 'joi';
import _omit from 'lodash/fp/omit';

import {IdNotFoundError, InvalidIncidentTypeError} from './errors';

// {array} valid incident types
const validTypes = ['backfilled', 'realtime', 'scheduled'];


/**
 * Formats an incident object from the db. It removes
 * any data points specific to the db.
 * @param {object} incidentDb
 * @return {object}
 */
const format = (incidentDb) => {
  const incident = _omit(['_id'])(incidentDb);
  incident.updates = incident.updates.map(_omit(['_id']));
  return incident;
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

  // caches the repo for each type
  const typesRepo = [];

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
   * Returns a repo for a given subscription type.
   * @param {string} type
   * @return {Promise}
   *  if success, repo object
   *  if failed, error
   */
  repo.ofType = (type) => {

    // validate type
    if (validTypes.includes(type) === false) {
      return Promise.reject(new InvalidIncidentTypeError(type));
    }

    // if not cached, get it
    if (!typesRepo[type]) {
      typesRepo[type] = require(`./incident_types/${type}`).init(dao, messagingQueue); // eslint-disable-line
    }

    return Promise.resolve(typesRepo[type]);

  };


  return repo;

};

export default {
  init,
  validTypes
};
