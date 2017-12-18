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

  const commonRepo = common.init(dao);

  // repo object. add functions from common object to this repo
  const repo = Object.assign({}, {
    type: 'webhook',
    unsubscribe: commonRepo.unsubscribe,
    manageComponents: commonRepo.manageComponents
  });

  /**
   * Adds a webhook subscription.
   * @param {object} data
   * @return {object}
   */
  repo.subscribe = async (data) => {

    let subscriptionObj = Object.assign({ components: [] }, _cloneDeep(data), {
      id: subscriberEntity.generateId(),
      type: 'webhook',
      created_at: new Date(),
      updated_at: new Date(),
      is_confirmed: true // for webhook, there is no confirmation needed
    });

    // validate
    subscriptionObj = await commonRepo.buildValidEntity(subscriptionObj);

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
