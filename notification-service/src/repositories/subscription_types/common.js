/**
 * @fileoverview Common functions between different types of subscription
 */

import _cloneDeep from 'lodash/fp/cloneDeep';

import { IdNotFoundError } from '../errors';
import { subscriber as subscriberEntity } from '../../entities/index';

/**
 * Init repo
 * @param {object} dao
 * @return {object}
 */
const init = (dao) => {

  // repo object
  const repo = {};

  /**
   * Validate the subscription object passed.
   * subscription object.
   * @param {object} data
   * @return {promise}
   *  on success, validated object
   *  on failure, validation error
   */
  repo.buildValidEntity = async (data) => {
    // build and validate entity
    const validEntity = await subscriberEntity.validate(data);
    return validEntity;
  };

  /**
   * Saves a subscription object in db
   * @param {object} subscriptionObj
   * @return {promise}
   *  on success, saved object
   *  on failure, error
   */
  repo.saveDb = async (subscriptionObj) => {

    const cloned = _cloneDeep(subscriptionObj);

    let isNew = false;

    // add id, if new
    if (!cloned.id) {
      isNew = true;
      cloned.id = subscriberEntity.generateId();
      cloned.created_at = new Date();
    }

    cloned.updated_at = new Date();

    // validate
    const validEntity = await repo.buildValidEntity(cloned);

    if (isNew) {
      await dao.insert(validEntity);
    }
    else {
      await dao.update(validEntity, { id: validEntity.id });
    }

    return validEntity;

  };

  /**
   * Unsubscribes/removes a subscription
   * @param {object} subscriptionObj
   * @return {promise}
   */
  repo.unsubscribe = async (subscriptionObj) => {

    const { id } = subscriptionObj;

    const cnt = await dao.remove({ id });
    if (cnt !== 1) {
      throw new IdNotFoundError(`Invalid subscription object passed. ID: ${id}.`);
    }

  };

  /**
   * Marks the subscription confirmed.
   * @param {object} subscriptionObj
   * @return {promise}
   *  on success, updated object
   *  on failure, error
   */
  repo.markConfirmed = async (subscriptionObj) => {

    // if already confirmed, nothing to do
    if (subscriptionObj.is_confirmed === true) {
      return subscriptionObj;
    }

    // clone obj and update flag
    const newObj = Object.assign(_cloneDeep(subscriptionObj), {
      is_confirmed: true
    });

    const updatedObj = await repo.saveDb(newObj);
    return updatedObj;

  };

  /**
   * Manages components for a subscription. Passed components will
   * replace whatever is currently there.
   * @param {object} subscriptionObj
   * @param {array} components
   * @return {promise}
   *  on success, updated object
   *  on failure, error
   */
  repo.manageComponents = async (subscriptionObj, components) => {

    // clone obj and update components
    const newObj = Object.assign(_cloneDeep(subscriptionObj), {
      components: components || []
    });

    const updatedObj = await repo.saveDb(newObj);
    return updatedObj;

  };

  return repo;

};

export default {
  init
};
