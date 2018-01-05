/**
 * @fileoverview Specific functions related to email subscriptions
 */

import _cloneDeep from 'lodash/fp/cloneDeep';

import common from './common';
import { DuplicatedSubscriptionError } from '../errors';

import emailLib from '../../lib/email';
import logger from '../../lib/logger';

/**
 *
 */
const getFooterLinks = (subscriptionObj) => {
  return {};
};

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
   * @return {promise}
   *  on sucess, subscription object
   *  on failure, error
   */
  repo.subscribe = async (data) => {

    // build subscription object
    let subscriptionObj = Object.assign({ components: [] }, _cloneDeep(data), {
      type: 'email',
      is_confirmed: false
    });

    // check for duplication
    const { email } = subscriptionObj;
    const duplicatedCnt = await dao.count({ email });
    if (duplicatedCnt > 0) {
      throw new DuplicatedSubscriptionError(`Email address (${email}) is already subscribed.`);
    }

    // save in db
    subscriptionObj = await commonRepo.saveDb(subscriptionObj);

    // send a link
    try {
      await repo.sendConfirmationLink(subscriptionObj);
    }
    catch (e) {
      logger.error(e);
    }

    return subscriptionObj;

  };

  /**
   * Send a confirmation link for the subscription if not
   * confirmed.
   * @param {object} subscriptionObj
   * @return {promise}
   *  on success, void
   *  on failure, error
   */
  repo.sendConfirmationLink = async (subscriptionObj) => {

    if (subscriptionObj.is_confirmed === false) {
      // send a confirmation email out
      await emailLib.send('confirmation_email_subscription', subscriptionObj.email, subscriptionObj);
    }

  };

  /**
   * Notifies all the email subscriptions of this latest incident update
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

    // send out emails
    const emails = subscriptions.map(s => {

      const params = {
        links: {
          footer: getFooterLinks(s),
          incident: ''
        },
        incidentUpdate: latestUpdate
      };

      return emailLib.send(
        'new_incident_update_notification',
        s.email,
        params
      );

    });

    await Promise.all(emails);

  };

  return repo;

};

export default { init };
