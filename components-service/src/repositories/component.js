/**
 * @fileoverview Repository to manage components
 */

import _pick from 'lodash/fp/pick';
import _omit from 'lodash/fp/omit';
import _cloneDeep from 'lodash/fp/cloneDeep';

import {component as componentEntity} from '../entities/index';
import {IdNotFoundError} from './errors';


/**
 * Initializes the repo
 * @param {object} dao - database access object
 *  for components collection
 * @param {repo} groupRepo - component group repo
 * @return {object}
 */
const init = (dao, groupRepo) => {

  if (dao.name !== 'components') {
    throw new Error(`Invalid DAO passed to this repo. Passed dao name: ${dao.name}`);
  }

  /**
   * Validates a component data before saving it.
   * @param {object} data to validate
   * @return {Promise}
   *  if fulfilled, {object} validated component data
   *  if rejected, {Error} Error
   */
  const buildValidEntity = async (data) => {

    // basic validation.
    const component = await componentEntity.validate(data);

    // validate group id, if present
    if (data.group_id) {
      const groupIdExists = await groupRepo.doesIdExists(data.group_id);
      if (groupIdExists === false) {
        throw new IdNotFoundError(`Invalid component group id passed: ${data.group_id}.`);
      }
    }

    return component;

  };

  /**
   * Formats a component.
   * @param {object} component
   * @return {object}
   */
  const format = (component) => {
    return _omit(['_id'])(component);
  };

  /**
   * Saves a component object in db
   * @param {object} componentObj
   * @return {promise}
   *  on success, saved object
   *  on failure, error
   */
  const saveDb = async (componentObj) => {

    const cloned = _cloneDeep(componentObj);

    let isNew = false;

    // add id, if new
    if (!cloned.id) {
      isNew = true;
      cloned.id = componentEntity.generateId();
      cloned.created_at = new Date();
    }

    cloned.updated_at = new Date();

    // validate
    const validEntity = await buildValidEntity(cloned);

    if (isNew) {
      await dao.insert(validEntity);
    }
    else {
      await dao.update(validEntity, { id: validEntity.id });
    }

    return validEntity;

  };


  // repo object
  const repo = {
    name: dao.name
  };

  /**
   * Loads a component.
   * @param {string} id - component id
   * @return {Promise}
   *  if fulfilled, {object} component data
   *  if rejected, {Error} error
   */
  repo.load = async (id) => {

    const data = await dao.find({ id });

    if (data.length !== 1) {
      throw new IdNotFoundError(`Invalid component id passed: ${id}.`);
    }

    return format(data[0]);

  };

  /**
   * Returns a list of components based on query
   * @param {object} filter
   *   fields: active, status, group_id
   * @return {Promise}
   *  if fulfilled, {array} array of components
   *  if rejected, {Error} error
   */
  repo.list = async (filter) => {

    // sort by group and then the sort order and then id. in
    // case sort_order is same, it will order by creation (_id)
    const sortBy = { group_id: 1, sort_order: 1, _id: 1 };

    // build predicate
    const pred = _pick(['active', 'group_id', 'status'])(filter);

    const components = await dao.find(pred, sortBy);
    return components.map(format);

  };

  /**
   * Creates a new component.
   * @param {object} data
   * @return {Promise}
   *  if fulfilled, {object} component object
   *  if rejected, {Error} error
   */
  repo.create = async (data) => {

    const defaultValues = {
      active: true,
      description: null,
      group_id: null,
      status: 'operational'
    };

    let componentObj = Object.assign({}, defaultValues, _cloneDeep(data));

    // validate, save and return the formatted data
    componentObj = await saveDb(componentObj);

    return format(componentObj);

  };

  /**
   * Updates a component.
   * @param {object} componentObj
   * @param {object} data - Data for the component. This will merge with the
   *   existing data.
   * @return {Promise}
   *  if fulfilled, {object} component object
   *  if rejected, {Error} error
   */
  repo.update = async (componentObj, data) => {
    let updatedObj = Object.assign({}, _cloneDeep(componentObj), data);
    updatedObj = await saveDb(updatedObj);
    return format(updatedObj);
  };

  /**
   * Removes a component.
   * @param {object} componentObj
   * @return {Promise}
   *  if fulfilled, void
   *  if rejected, {Error} error
   */
  repo.remove = async (componentObj) => {

    const { id } = componentObj;

    const cnt = await dao.remove({ id });

    if (cnt !== 1) {
      throw new IdNotFoundError(`Invalid component id passed: ${id}.`);
    }

  };

  return repo;

};

export default { init };
