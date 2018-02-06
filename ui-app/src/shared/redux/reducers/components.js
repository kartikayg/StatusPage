/**
 * @fileoverview Component state
 */

import * as actionTypes from '../actions/types';

const components = (state = [], action) => {

  switch (action.type) {

    case actionTypes.COMPONENT_REFRESHED:
      return action.components;

    // add a new component
    case actionTypes.ADD_COMPONENT:
      return [...state, action.component];

    // update a component
    case actionTypes.UPDATE_COMPONENT:
      return state.map(c => {
        return (c.id === action.component.id) ? action.component : c;
      });

    // update just the sort order
    case actionTypes.UPDATE_COMPONENT_SORT_ORDER:
      return state.map(c => {
        return (c.id === action.id) ? { ...c, sort_order: action.sortOrder } : c;
      });

    // update just the status
    case actionTypes.UPDATE_COMPONENT_STATUS:
      return state.map(c => {
        return (c.id === action.id) ? { ...c, status: action.status } : c;
      });

    default:
      return state;
  }

};

export default components;
