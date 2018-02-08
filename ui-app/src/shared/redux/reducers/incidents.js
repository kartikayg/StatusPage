/**
 * @fileoverview Incidents state
 */

import * as actionTypes from '../actions/types';

const incidents = (state = [], action) => {

  switch (action.type) {

    // add a new component
    case actionTypes.ADD_INCIDENT:
      return [...state, action.incident];

    // remove an incident
    case actionTypes.REMOVE_INCIDENT:
      return state.filter(i => {
        return i.id !== action.id;
      });

    default:
      return state;
  }

};

export default incidents;
