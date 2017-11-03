/**
 * @fileoverview Repository to manage component groups
 */

import pick from 'lodash/fp/pick';

import {componentGroup as componentGroupEntity} from '../entities/index';
import {IdNotFoundError} from './errors';


/**
 * Initializes the repo
 * @param {object} dao - database access object 
 *  for components collection
 * @return {object}
 */
const init = (dao) => {

  if (dao.name !== 'component_groups') {
    throw new Error(`Invalid DAO passed to this repo. Passed dao name: ${dao.name}.`);
  }

  const repo = {
    name: dao.name
  };

  /**
   * Validates a component group data before saving it.
   * @param {object} data to validate
   * @return {Promise} 
   *  if fulfilled, {object} validated component data
   *  if rejected, {Error} Error
   */
  const validateData = async (data) => {
    const component = await componentGroupEntity.validate(data);
    return component;
  };

  /**
   * Formats a component group.
   * @param {object} componentGroup
   * @return {object}
   */
  const format = (componentGroup) => {
    const grp = Object.assign({}, componentGroup);
    delete grp._id;
    return grp;
  };

  /**
   * Checks whether the group id exists or not
   * @param {string} id
   * @return {Promise} 
   *  if fulfilled, true or false
   *  if rejected, Error
   */
  repo.doesIdExists = async (id) => {
    const cnt = await dao.count({ id });
    return cnt === 1;
  };

  /**
   * Loads a component group.
   * @param {string} id - component group id
   * @return {Promise}
   *  if fulfilled, {object} component data
   *  if rejected, {Error} error
   */
  repo.load = async (id) => {

    const data = await dao.find({ id });

    if (data.length !== 1) {
      throw new IdNotFoundError(`Invalid component group id passed: ${id}.`);
    }

    return format(data[0]);

  };

  /**
   * Returns a list of component groups based on filters
   * @param {object} filter
   *   fields: active, status
   * @return {Promise}
   *  if fulfilled, {array} array of component groups
   *  if rejected, {Error} error
   */
  repo.list = async (filter) => {

    // sort by sort order and then id
    const sortBy = { sort_order: 1, _id: 1 };

    // build predicate
    const pred = pick(['active', 'status'])(filter);

    const groups = await dao.find(pred, sortBy);
    return groups.map(format);

  };

  /**
   * Creates a new component group.
   * @param {object} data
   * @return {Promise} 
   *  if fulfilled, {object} component group object
   *  if rejected, {Error} error
   */
  repo.create = async (data) => {

    // validate, save and return the formatted data
    const group = await validateData(data);

    group.id = componentGroupEntity.generateId();
    group.created_at = (new Date()).toISOString();
    group.updated_at = (new Date()).toISOString();

    const groupIns = await dao.insert(group);

    return format(groupIns);

  };

  /**
   * Updates a component group.
   * @param {string} id - component group id
   * @param {object} newData - New Data for the component group. This should be the
   *  entire the component group data set.
   * @return {Promise} 
   *  if fulfilled, {object} component group object
   *  if rejected, {Error} error
   */
  repo.update = async (id, newData) => {

    // load the component group
    const currentGroup = await repo.load(id);

    // validate new data
    const v = await validateData(newData);
    const updGroup = Object.assign({}, currentGroup, v);

    updGroup.updated_at = (new Date()).toISOString();

    await dao.update(updGroup, { id });

    return format(updGroup);

  };

  /**
   * Partial updates a component group.
   * @param {string} id - group id
   * @param {object} data - whatever fields that needs to be updated.
   * @return {promise} 
   *  if fulfilled: component group object
   *  if rejected: Error
   */
  repo.partialUpdate = async (id, data) => {

    // load the component group
    const currentGroup = await repo.load(id);

    // merge the new data with existing
    const updGroup = Object.assign({}, currentGroup, data);

    delete updGroup.created_at;
    delete updGroup.updated_at;
    delete updGroup.id;
    delete updGroup._id;

    // update the group
    const res = await repo.update(id, updGroup);
    return res;

  };

  /**
   * Removes a component group.
   * @param {string} id - component group id
   * @return {Promise} 
   *  if fulfilled, void
   *  if rejected, {Error} error
   */
  repo.remove = async (id) => {

    // remove the component
    const cnt = await dao.remove({ id });

    if (cnt !== 1) {
      throw new IdNotFoundError(`Invalid component group id passed: ${id}.`);
    }

  };


  return repo;

};

export default Object.create({ init });
