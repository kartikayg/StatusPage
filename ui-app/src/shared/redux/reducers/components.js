/**
 * @fileoverview Component state
 */

import { COMPONENT_ADDED, COMPONENT_REFRESHED } from '../actions/types';

const components = (state = [], action) => {

  switch (action.type) {

    case COMPONENT_REFRESHED:
      return action.components;

    case COMPONENT_ADDED:
      return [...state, action.component];

    default:
      return state;
  }
};

export default components;
