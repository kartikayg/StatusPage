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
   * Validate the object passed and returns a proper
   * subscription object.
   * @param {object} data
   * @return {object}
   * @throws {Error} validation error
   */
  repo.buildValidEntity = async (data) => {
    // build and validate entity
    const validEntity = await subscriberEntity.validate(data);
    return validEntity;
  };

  /**
   * Updates the object in db
   * @param {object} subscriptionObj
   * @return {object}
   */
  repo.updateDb = async (subscriptionObj) => {

    const { id } = subscriptionObj;
    const validEntity = await repo.buildValidEntity(subscriptionObj);
    validEntity.updated_at = new Date();

    await dao.update(validEntity, { id });

    return validEntity;

  };

  /**
   * Unsubscribes/removes a subscription
   * @param {object} subscriptionObj
   * @return {void}
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
   * @return {object}
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

    const updatedObj = await repo.updateDb(newObj);
    return updatedObj;

  };

  /**
   * Manages components for a subscription. Passed components will
   * replace whatever is currently there.
   * @param {object} subscriptionObj
   * @param {array} components
   * @return {object}
   */
  repo.manageComponents = async (subscriptionObj, components) => {

    // clone obj and update components
    const newObj = Object.assign(_cloneDeep(subscriptionObj), {
      components: components || []
    });

    const updatedObj = await repo.updateDb(newObj);
    return updatedObj;

  };

  return repo;

};

export default {
  init
};
