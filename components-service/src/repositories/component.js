/**
 * @fileoverview Repository to manage components
 */

import pick from 'lodash/fp/pick';

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

  const repo = {
    name: dao.name
  };

  /**
   * Validates a component data before saving it.
   * @param {object} data to validate
   * @return {Promise} 
   *  if fulfilled, {object} validated component data
   *  if rejected, {Error} Error
   */
  const validateData = async (data) => {

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
    const cmp = Object.assign({}, component);
    delete cmp._id;
    return cmp;
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
    const pred = pick(['active', 'group_id', 'status'])(filter);

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

    // validate, save and return the formatted data
    const component = await validateData(data);

    component.id = componentEntity.generateId();
    component.created_at = (new Date()).toISOString();
    component.updated_at = (new Date()).toISOString();

    const componentIns = await dao.insert(component);

    return format(componentIns);

  };

  /**
   * Updates a component.
   * @param {string} id - component id
   * @param {object} newData - New Data for the component. This should be the
   *  entire the component data set.
   * @return {Promise} 
   *  if fulfilled, {object} component object
   *  if rejected, {Error} error
   */
  repo.update = async (id, newData) => {

    // load the component
    const currentCmp = await repo.load(id);

    // validate new data
    const v = await validateData(newData);
    const updComponent = Object.assign({}, currentCmp, v);

    updComponent.updated_at = (new Date()).toISOString();

    await dao.update(updComponent, { id });

    return updComponent;

  };

  /**
   * Partial updates a component.
   * @param {string} componentId
   * @param {object} newData - New Data for the component. This should be the
   *  entire the component data set.
   * @return {promise} 
   *  on success: component object
   *  on failure: Error
   */
  repo.partialUpdate = async (id, data) => {

    // load the component
    const currentCmp = await repo.load(id);

    // merge the new data with existing
    const newComponent = Object.assign({}, currentCmp, data);

    delete newComponent.created_at;
    delete newComponent.updated_at;
    delete newComponent.id;
    delete newComponent._id;

    // update the component
    const res = await repo.update(id, newComponent);
    return res;

  };

  /**
   * Removes a component.
   * @param {string} id - component id
   * @return {Promise} 
   *  if fulfilled, void
   *  if rejected, {Error} error
   */
  repo.remove = async (id) => {

    // remove the component
    const cnt = await dao.remove({ id });

    if (cnt !== 1) {
      throw new IdNotFoundError(`Invalid component id passed: ${id}.`);
    }

  };

  return repo;

};

export default Object.create({ init });
