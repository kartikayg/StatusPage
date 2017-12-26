/**
 * @fileoverview Specific functions related to scheduled incidents
 */

import moment from 'moment';
import _pick from 'lodash/fp/pick';
import _cloneDeep from 'lodash/fp/cloneDeep';

import common from './common';
import { InvalidDateError, InvalidIncidentStatusError } from '../errors';

const INCIDENT_TYPE = 'scheduled';

/**
 * Validates start and end time for a scheduled incident. For start time
 * it uses the created_at field on incident obj. If not set, it uses the
 * current time
 * @param {object} incidentObj
 * @throws {InvalidDateError} throws error in case there is an issue
 * @return {void}
 */
const validateStartEndTime = (incidentObj) => {

  if (!incidentObj.scheduled_start_time || !incidentObj.scheduled_end_time) {
    throw new InvalidDateError('Missing start or end time');
  }

  const minMoment = incidentObj.created_at ? moment(incidentObj.created_at) : moment();
  const startMoment = moment(incidentObj.scheduled_start_time);
  const endMoment = moment(incidentObj.scheduled_end_time);

  // scheduled start time must be in future
  if (startMoment.isBefore(minMoment)) {
    throw new InvalidDateError('Start time must be in future');
  }

  // scheduled end time must be after start time
  if (endMoment.isBefore(startMoment)) {
    throw new InvalidDateError('End time must be after the start time');
  }

};

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
    incUpdateObj.status = 'scheduled';

    // build incident object

    const props = [
      'name',
      'components',
      'scheduled_start_time',
      'scheduled_end_time',
      'scheduled_auto_status_updates',
      'scheduled_auto_updates_send_notifications'
    ];

    const defaultValues = {
      scheduled_auto_status_updates: true,
      scheduled_auto_updates_send_notifications: true
    };

    let incidentObj = Object.assign({}, defaultValues, _pick(props)(data), {
      type: INCIDENT_TYPE,
      scheduled_status: 'scheduled',
      updates: [incUpdateObj]
    });

    commonRepo.setResolvedStatus(incidentObj);

    validateStartEndTime(incidentObj);

    // save in db
    incidentObj = commonRepo.saveDb(incidentObj);

    return incidentObj;

  };

  /**
   * Updates a scheduled incident. The following rules apply for this update:
   *  1. Once scheduled, the next step is either in_progress or cancelled.
   *  2. Once in_progress:
   *    - Can't cancel
   *    - Can't update start time
   *  3. Once resolved, no meta fields can be updated. Only a incident-update
   *     can be posted
   * @param {object} incidentobj
   * @param {object} data
   * @return {object}
   */
  repo.update = async (incidentObj, data) => {

    if (!incidentObj || incidentObj.type !== INCIDENT_TYPE) {
      throw new Error('Invalid Object passed.');
    }

    // also validate using the entity schema
    commonRepo.buildValidEntity(incidentObj);

    const { scheduled_status: scheduledStatus } = incidentObj;

    // properties to update on incident meta
    const propsToUpdate = [];

    // if incident still not resolved
    if (!incidentObj.is_resolved) {
      propsToUpdate.push(
        'name',
        'components',
        'scheduled_end_time',
        'scheduled_auto_status_updates',
        'scheduled_auto_updates_send_notifications'
      );
    }

    // if incident still not started,
    if (scheduledStatus === 'scheduled') {
      propsToUpdate.push('scheduled_start_time');
    }

    // build the updated object and copy over any new
    // allowed properties
    let updatedObj = Object.assign(
      _cloneDeep(incidentObj),
      _pick(propsToUpdate)(data)
    );

    // new status for incident.
    let newStatus = scheduledStatus;

    // if either of them are present, create a new incident-update
    if (data.status || data.message) {

      const incUpdateObj = commonRepo.buildIncidentUpdateObj(data);

      if (incidentObj.is_resolved || scheduledStatus === 'cancelled') {
        incUpdateObj.status = 'update';
      }
      else {

        // depending on the current scheduled status, only certain
        // statuses are allowed for the updates
        const allowedStatuses = {
          scheduled: ['in_progress', 'cancelled'],
          in_progress: ['in_progress', 'verifying', 'resolved']
        };

        if (allowedStatuses[scheduledStatus].includes(incUpdateObj.status) === false) {
          throw new InvalidIncidentStatusError(`Status: ${incUpdateObj.status} is not allowed for this incident.`);
        }
      }

      // based on the posted status, update the scheduled status if needed
      switch (incUpdateObj.status) {
        case 'in_progress':
        case 'cancelled':
          newStatus = incUpdateObj.status;
          break;
        case 'resolved':
          newStatus = 'completed';
          break;
        default:
          break;
      }

      updatedObj.updates.push(incUpdateObj);

      // set resolved status
      commonRepo.setResolvedStatus(updatedObj);

    }

    updatedObj.scheduled_status = newStatus;

    validateStartEndTime(updatedObj);

    // save in db
    updatedObj = await commonRepo.saveDb(updatedObj);

    return updatedObj;

  };

  return repo;

};

export default {
  init
};
