/**
 * @fileoverview
 */

import pick from 'lodash/fp/pick';

import {component as componentEntity} from '../entities/index';
import {IdNotFoundError} from './errors';

/**
 * 
 */
const init = (dao, groupRepo) => {

  if (dao.name !== 'components') {
    throw new Error(`Invalid DAO passed to this repo. Passed dao name: ${dao.name}`);
  }

  /**
   * Validates a component data before saving it.
   * @param {object} data to validate
   * @return {Promise} 
   *  if fulfilled, validated component data
   *  if rejected, Error
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
   *
   */
  const format = (component) => {
    const cmp = Object.assign({}, component);
    delete cmp._id;
    return cmp;
  };

  /**
   *
   */
  const load = async (id) => {

    const data = await dao.find({ id });

    if (data.length !== 1) {
      throw new IdNotFoundError(`Invalid component id passed: ${id}.`);
    }

    return format(data[0]);

  };

  /**
   *
   */
  const list = async (query = {}) => {

    // sort by group and then the sort order and then id. in
    // case sort_order is same, it will order by creation (_id)
    const sortBy = { group_id: 1, sort_order: 1, _id: 1 };

    // build predicate
    const pred = pick(['active', 'group_id', 'status'])(query);

    const components = await dao.find(pred, sortBy);

    return components.map(format);

  };

  /**
   * Creates a new component.
   * @param {object} data
   * @return {promise} 
   *  on success: component object with id
   *  on failure: Error
   */
  const create = async (data) => {

    // validate, save and return the formatted data
    const component = await validateData(data);

    component.id = componentEntity.generateId();
    component.created_at = (new Date()).toISOString();
    component.updated_at = (new Date()).toISOString();

    await dao.insert(component);

    return format(component);

  };

  /**
   * Updates a component.
   * @param {string} componentId
   * @param {object} newData - New Data for the component. This should be the
   *  entire the component data set.
   * @return {promise} 
   *  on success: component object
   *  on failure: Error
   */
  const update = async (id, newData) => {

    // load the component
    const currentCmp = await load(id);

    // validate new data
    const v = await validateData(newData);
    const updComponent = Object.assign({}, currentCmp, v);

    updComponent.updated_at = (new Date()).toISOString();

    await dao.update(updComponent, { id });

    // format the data and return
    return format(updComponent);

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
  const partialUpdate = async (id, data) => {

    // load the component
    const currentCmp = await load(id);

    // merge the new data with existing
    const newComponent = Object.assign({}, currentCmp, data);

    delete newComponent.created_at;
    delete newComponent.updated_at;
    delete newComponent.id;

    // update the component
    const res = await update(id, newComponent);
    return res;

  };

  /**
   *
   */
  const remove = async (id) => {

    // remove the component
    const cnt = await dao.remove({ id });

    if (cnt !== 1) {
      throw new IdNotFoundError(`Invalid component id passed: ${id}.`);
    }

  };

  return Object.create({
    name: dao.name,
    load,
    list,
    create,
    update,
    partialUpdate,
    remove
  });

};

export default Object.create({ init });
