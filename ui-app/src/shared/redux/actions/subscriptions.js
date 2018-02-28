/**
 * @fileoverview Subscription actions
 */

import * as actionTypes from './types';

/**
 * add subscription action
 * @param {object} subscription - entire subscription object
 * @return {object}
 */
export const addSubscription = (subscription) => {
  return {
    type: actionTypes.ADD_SUBSCRIPTION,
    subscription
  };
};

/**
 * remove subscription action
 * @param {id} subscription id
 * @return {object}
 */
export const removeSubscription = (id) => {
  return {
    type: actionTypes.REMOVE_SUBSCRIPTION,
    id
  };
};
