/**
 * @fileoverview Entry point for getting repositories
 */

import subscription from './subscription';
import notification from './notification';

/**
 * Initializes the repositories
 * @param {object} db - database object
 * @return {object}
 */
const init = (db) => {

  const subscriptionRepo = subscription.init(db.dao('subscriptions'));
  const notificationRepo = notification.init(subscriptionRepo);

  return {
    subscription: subscriptionRepo,
    notification: notificationRepo
  };

};

export default { init };
