/**
 * @fileoverview Helper functions to format subscriptions related data
 */

/**
 * Filter subscriptions by type
 * @param {array} subscriptions
 * @param {string} type
 * @return {array}
 */
const filterByType = (subscriptions, type) => {
  return subscriptions.filter(s => {
    return s.type === type;
  });
};

export {
  filterByType
};
