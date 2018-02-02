/**
 * @fileoverview Component group state
 */

import { ADD_COMPONENT_GROUP } from '../actions/types';

const componentGroups = (state = [], action) => {

  switch (action.type) {

    // add a new component
    case ADD_COMPONENT_GROUP:
      return [...state, action.group];

    default:
      return state;
  }

};

export default componentGroups;
