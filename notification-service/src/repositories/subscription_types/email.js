/**
 * @fileoverview Specific functions related to email subscriptions
 */

import _cloneDeep from 'lodash/fp/cloneDeep';

import common from './common';
import { DuplicatedSubscriptionError } from '../errors';
import { subscriber as subscriberEntity } from '../../entities/index';

import emailLib from '../../lib/email';

/**
 * Init repo
 * @param {object} dao
 * @return {object}
 */
const init = (dao) => {

  const commonRepo = common.init(dao);

  // repo object. add functions from common object to this repo
  const repo = Object.assign({}, {
    type: 'email',
    unsubscribe: commonRepo.unsubscribe,
    markConfirmed: commonRepo.markConfirmed,
    manageComponents: commonRepo.manageComponents
  });

  /**
   * Adds an email subscription.
   * @param {object} data
   * @return {object}
   */
  repo.subscribe = async (data) => {

    let subscriptionObj = Object.assign(_cloneDeep(data), {
      id: subscriberEntity.generateId(),
      type: 'email'
    });

    // validate
    subscriptionObj = await commonRepo.buildValidEntity(subscriptionObj);

    // check for duplication
    const { email } = subscriptionObj;
    const duplicatedCnt = await dao.count({ email });
    if (duplicatedCnt > 0) {
      throw new DuplicatedSubscriptionError(`Email address (${email}) is already subscribed.`);
    }

    await dao.insert(subscriptionObj);
    await repo.sendConfirmationLink(subscriptionObj);

    return subscriptionObj;

  };

  /**
   *
   */
  repo.sendConfirmationLink = async (subscriptionObj) => {
    // send a confirmation email out
    await emailLib.send('confirmation_email_subscription', subscriptionObj.email, subscriptionObj);
  };

  /**
   *
   */
  repo.notifyOfNewIncidentUpdate = async (subscriptions) => {

  };

  return repo;

};

export default { init };
