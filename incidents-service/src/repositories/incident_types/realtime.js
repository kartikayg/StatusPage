/**
 * @fileoverview Specific functions related to realtime incidents
 */

import _pick from 'lodash/fp/pick';
import _cloneDeep from 'lodash/fp/cloneDeep';

import common from './common';

const INCIDENT_TYPE = 'realtime';

/**
 * Init repo
 * @param {object} dao
 * @param {object} messagingQueue
 * @return {object}
 */
const init = (dao, messagingQueue) => {

  const commonRepo = common.init(dao, messagingQueue);

  // repo object. add functions from common object to this repo
  const repo = Object.assign({}, {
    type: INCIDENT_TYPE,
    remove: commonRepo.remove,
    changeIncidentUpdateEntry: commonRepo.changeIncidentUpdateEntry
  });

  /**
   * Creates a realtime incident
   * @param {object} data
   * @return {promise}
   *  on sucess, incident object
   *  on failure, error
   */
  repo.create = async (data) => {

    // build incident-update obj
    const incUpdateObj = commonRepo.buildIncidentUpdateObj(data);

    // build incident object
    let incidentObj = Object.assign(_pick(['name', 'components'])(data), {
      type: INCIDENT_TYPE,
      updates: [incUpdateObj]
    });

    // set resolved status
    commonRepo.setResolvedStatus(incidentObj);

    // save in db
    incidentObj = commonRepo.saveDb(incidentObj);

    return incidentObj;

  };

  /**
   * Updates an incident. Following rules are applied:
   *  1. Name and type of the incident can't be updated. They will be ignored
   *     if passed.
   *  2. Only if a message or new status is passed, an incident-update will be created
   * @param {object} incidentObk
   * @param {object} data - data for the update
   * @return {Promise}
   *  if fulfilled, {object} incident object
   *  if rejected, {Error} error
   */
  repo.update = async (incidentObj, data) => {

    if (!incidentObj || incidentObj.type !== INCIDENT_TYPE) {
      throw new Error('Invalid Object passed.');
    }

    // build the updated obj. only field that can be updated for meta object
    // is components
    let updatedObj = _cloneDeep(incidentObj);

    // if the incident is not resolved, then update whatever fields are
    // allowed.
    if (updatedObj.is_resolved !== true) {
      Object.assign(updatedObj, _pick(['components'])(data));
    }

    // if either of them are present, create a new incident-update
    if (data.status || data.message) {

      const incUpdateObj = commonRepo.buildIncidentUpdateObj(data);

      if (incidentObj.is_resolved === true) {
        incUpdateObj.status = 'update';
      }

      updatedObj.updates.push(incUpdateObj);

      // set resolved status
      commonRepo.setResolvedStatus(updatedObj);

    }

    // save in db
    updatedObj = commonRepo.saveDb(updatedObj);

    return updatedObj;

  };

  return repo;

};

export default {
  init
};
