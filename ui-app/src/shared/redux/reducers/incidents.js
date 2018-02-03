/**
 * @fileoverview Incidents state
 */

import { ADD_INCIDENT } from '../actions/types';

const incidents = (state = [], action) => {

  switch (action.type) {

    // add a new component
    case ADD_INCIDENT:
      return [...state, action.incident];

    default:
      return state;
  }

};

export default incidents;
