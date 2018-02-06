/**
 * @fileoverview Incident related actions
 */

import * as actionTypes from './types';

/**
 * add incident action
 * @param {object} incident - entire incident object
 * @return {object}
 */
export const addIncident = (incident) => {
  return {
    type: actionTypes.ADD_INCIDENT,
    incident
  };
};
