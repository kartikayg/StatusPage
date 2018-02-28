/**
 * @fileoverview Subscriptions state
 */

import * as actionTypes from '../actions/types';

const subscriptions = (state = [], action) => {

  switch (action.type) {

    // add a new subscription
    case actionTypes.ADD_SUBSCRIPTION:
      return [...state, action.subscription];

    // remove a subscription
    case actionTypes.REMOVE_SUBSCRIPTION:
      return state.filter(sb => {
        return sb.id !== action.id;
      });

    default:
      return state;
  }

};

export default subscriptions;
