/**
 * @fileoverview Specific functions related to email subscriptions
 */

import _cloneDeep from 'lodash/fp/cloneDeep';
import _orderBy from 'lodash/fp/orderBy';

import common from './common';

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

    // check for duplication, if exists just return that.
    const { email } = subscriptionObj;
    const duplicated = await dao.find({ email });
    if (duplicated.length > 0) {
      return duplicated[0];
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
      await emailLib.send('confirmation_email_subscription', subscriptionObj, subscriptionObj);
    }

  };

  /**
   * Notifies all the email subscriptions of this latest incident update
   * @param {object} incident
   * @param {array} subscription
   * @return {promise}
   *  on success, void
   *  on failure, error
   */
  repo.notifyOfNewIncidentUpdate = async (incident, subscriptions) => {

    const copy = _cloneDeep(incident);

    // sort the updates so that recent is one at the top
    copy.lastUpdate = _orderBy(['created_at'])(['desc'])(incident.updates)[0]; // eslint-disable-line prefer-destructuring

    // send out emails
    const emails = subscriptions.map(s => {
      return emailLib.send('new_incident_update_notification', s, { incident: copy });
    });

    await Promise.all(emails);

  };

  return repo;

};

export default { init };
