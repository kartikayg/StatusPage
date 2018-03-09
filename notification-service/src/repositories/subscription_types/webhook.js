/**
 * @fileoverview Specific functions related to webhook subscriptions
 */

import axios from 'axios';
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
    const duplicated = await dao.find({ uri });
    if (duplicated.length > 0) {
      return duplicated[0];
    }

    // save in db
    subscriptionObj = await commonRepo.saveDb(subscriptionObj);

    return subscriptionObj;

  };

  /**
   * Notifies all the endpoints of this latest incident update
   * @param {object} latestUpdate
   *  name: incident name
   *  id: incident id
   *  status
   *  message
   *  displayed_at
   * @param {array} subscription
   * @return {promise}
   *  on success, void
   *  on failure, error
   */
  repo.notifyOfNewIncidentUpdate = async (latestUpdate, subscriptions) => {

    // send out posts
    const posts = subscriptions.map(s => {
      return axios.post(s.uri, latestUpdate, { timeout: 15000 })
        .catch(e => {});
    });

    await Promise.all(posts);

  };

  return repo;

};

export default { init };
