/**
 * @fileoverview Specific functions related to email subscriptions
 */

import _cloneDeep from 'lodash/fp/cloneDeep';

import common from './common';
import { DuplicatedSubscriptionError } from '../errors';
import { subscriber as subscriberEntity } from '../../entities/index';

import emailLib from '../../lib/email';
import logger from '../../lib/logger';

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

    let subscriptionObj = Object.assign({ components: [] }, _cloneDeep(data), {
      id: subscriberEntity.generateId(),
      created_at: new Date(),
      updated_at: new Date(),
      type: 'email',
      is_confirmed: false
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

    try {
      await repo.sendConfirmationLink(subscriptionObj);
    }
    catch (e) {
      logger.error(e);
    }

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
