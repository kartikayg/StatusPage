/**
 * @fileoverview Incidents state
 */

import * as actionTypes from '../actions/types';

const incidents = (state = [], action) => {

  switch (action.type) {

    // add a new component
    case actionTypes.ADD_INCIDENT:
      return [...state, action.incident];

    // update an incident
    case actionTypes.UPDATE_INCIDENT:
      return state.map(i => {
        return (i.id === action.incident.id) ? action.incident : i;
      });

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
