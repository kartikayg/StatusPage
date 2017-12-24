/**
 * @fileoverview Specific functions related to scheduled incidents
 */

import _pick from 'lodash/fp/pick';

import common from './common';

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
    type: 'scheduled',
    remove: commonRepo.remove,
    changeIncidentUpdateEntry: commonRepo.changeIncidentUpdateEntry
  });

  /**
   * Creates a scheduled incident
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
      type: 'realtime',
      updates: [incUpdateObj]
    });

    // set resolved status
    commonRepo.setResolvedStatus(incidentObj);

    // save in db
    incidentObj = commonRepo.saveDb(incidentObj);

    return incidentObj;

  };

  return repo;

};

export default {
  init
};
