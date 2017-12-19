/**
 * @fileoverview Repository to manage component groups
 */

import _pick from 'lodash/fp/pick';
import _cloneDeep from 'lodash/fp/cloneDeep';
import _omit from 'lodash/fp/omit';

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
  const buildValidateEntity = async (data) => {
    const validEntity = await componentGroupEntity.validate(data);
    return validEntity;
  };

  /**
   * Formats a component group.
   * @param {object} componentGroup
   * @return {object}
   */
  const format = (componentGroup) => {
    return _omit(['_id'])(componentGroup);
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
    const pred = _pick(['active', 'status'])(filter);

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

    const defaultValues = {
      active: true,
      description: null,
      status: 'operational',
      sort_order: 1
    };

    let groupObj = Object.assign({}, defaultValues, _cloneDeep(data), {
      id: componentGroupEntity.generateId(),
      created_at: new Date(),
      updated_at: new Date()
    });

    // validate, save and return the formatted data
    groupObj = await buildValidateEntity(groupObj);

    await dao.insert(groupObj);

    return format(groupObj);

  };

  /**
   * Updates a component group.
   * @param {string} id - component group id
   * @param {object} data - data for the component group. This will merge with the
   *   existing data.
   * @return {Promise}
   *  if fulfilled, {object} component group object
   *  if rejected, {Error} error
   */
  repo.update = async (id, data) => {

    // load the component group
    const currentGroupObj = await repo.load(id);

    let updatedObj = Object.assign({}, _cloneDeep(currentGroupObj), data);

    updatedObj = await buildValidateEntity(updatedObj);
    updatedObj.updated_at = new Date();

    await dao.update(updatedObj, { id });

    return format(updatedObj);

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

export default { init };
