/**
 * @fileoverview Specific functions related to webhook subscriptions
 */

import _cloneDeep from 'lodash/fp/cloneDeep';

import common from './common';
import { DuplicatedSubscriptionError } from '../errors';

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
   * @return {promise}
   *  on sucess, subscription object
   *  on failure, error
   */
  repo.subscribe = async (data) => {

    // build subscription object
    let subscriptionObj = Object.assign({ components: [] }, _cloneDeep(data), {
      type: 'webhook',
      is_confirmed: true // for webhook, there is no confirmation needed
    });

    // check for duplication
    const { uri } = subscriptionObj;
    const duplicatedCnt = await dao.count({ uri });
    if (duplicatedCnt > 0) {
      throw new DuplicatedSubscriptionError(`Webhook endpoint (${uri}) is already subscribed.`);
    }

    // save in db
    subscriptionObj = await commonRepo.saveDb(subscriptionObj);

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
