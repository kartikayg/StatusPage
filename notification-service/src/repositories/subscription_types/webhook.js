/**
 * @fileoverview Specific functions related to webhook subscriptions
 */

import _cloneDeep from 'lodash/fp/cloneDeep';

import common from './common';
import { DuplicatedSubscriptionError } from '../errors';
import { subscriber as subscriberEntity } from '../../entities/index';

/**
 * Init repo
 * @param {object} dao
 * @return {object}
 */
const init = (dao) => {

  if (dao.name !== 'subscriptions') {
    throw new Error(`Invalid DAO passed to this repo. Passed dao name: ${dao.name}`);
  }

  const commonRepo = common.init(dao);

  // repo object. add functions from common object to this repo
  const repo = Object.assign({}, {
    unsubscribe: commonRepo.unsubscribe,
    manageComponents: commonRepo.manageComponents
  });

  /**
   * Adds a webhook subscription.
   * @param {object} data
   * @return {object}
   */
  repo.subscribe = async (data) => {

    let subscriptionObj = Object.assign(_cloneDeep(data), {
      id: subscriberEntity.generateId(),
      type: 'webhook',
      is_confirmed: true // for webhook, there is no confirmation needed
    });

    // validate
    subscriptionObj = commonRepo.buildValidEntity(subscriptionObj);

    // check for duplication
    const { uri } = subscriptionObj;
    const duplicatedCnt = await dao.count({ uri });
    if (duplicatedCnt > 0) {
      throw new DuplicatedSubscriptionError(`Webhook endpoint (${uri}) is already subscribed.`);
    }

    await dao.insert(subscriptionObj);

    return subscriptionObj;

  };

  /**
   *
   */
  repo.notifyOfNewIncidentUpdate = async (subscriptions) => {

  };

  return repo;

};

export default { init };
