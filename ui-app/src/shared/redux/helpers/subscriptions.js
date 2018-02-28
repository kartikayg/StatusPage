/**
 * @fileoverview
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
