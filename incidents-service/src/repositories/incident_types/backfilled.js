/**
 * @fileoverview Specific functions related to backfilled incidents
 */

import _pick from 'lodash/fp/pick';

import common from './common';
import { UpdateNotAllowedError } from '../errors';

const INCIDENT_TYPE = 'backfilled';

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
    remove: commonRepo.remove
  });

  /**
   * Creates a backfilled incident
   * @param {object} data
   * @return {promise}
   *  on sucess, incident object
   *  on failure, error
   */
  repo.create = async (data) => {

    // build incident-update obj
    const incUpdateObj = commonRepo.buildIncidentUpdateObj(data);
    // there is only one update for backfilled and its marked resolved
    incUpdateObj.status = 'resolved';

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
   * Updates incident. For backfilled, there are no updates
   * allowed and an exception is thrown.
   * @param {object}
   * @return {error}
   */
  repo.update = async (incidentObj) => {

    if (!incidentObj || incidentObj.type !== INCIDENT_TYPE) {
      throw new Error('Invalid Object passed.');
    }

    throw new UpdateNotAllowedError(`Incident ${incidentObj.id} is of type backfilled and can't have any updates.`);

  };

  return repo;

};

export default {
  init
};
