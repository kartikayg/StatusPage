/**
 * @fileoverview
 */

import subscription from './subscription';
import notification from './notification';

/**
 *
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
