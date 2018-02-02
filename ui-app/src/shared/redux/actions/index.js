/**
 * @fileoverview
 */

import * as actionTypes from './types';

/**
 * update component action
 * @param {object} component - entire component object
 * @return {object}
 */
export const updateComponent = (component) => {
  return {
    type: actionTypes.UPDATE_COMPONENT,
    component
  };
};

/**
 * update component sort order action
 * @param {object}
 *  id - component id
 *  sort_order - new sort order
 * @return {object}
 */
export const updateComponentSortOrder = ({ id, sort_order }) => { // eslint-disable-line camelcase
  return {
    type: actionTypes.UPDATE_COMPONENT_SORT_ORDER,
    id,
    sortOrder: sort_order
  };
};
