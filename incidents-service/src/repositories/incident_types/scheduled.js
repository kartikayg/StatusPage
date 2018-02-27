/**
 * @fileoverview Specific functions related to scheduled incidents
 */

import moment from 'moment';
import _pick from 'lodash/fp/pick';
import _omit from 'lodash/fp/omit';
import _cloneDeep from 'lodash/fp/cloneDeep';
import _uniq from 'lodash/fp/uniq';

import common from './common';
import { InvalidDateError, InvalidIncidentStatusError } from '../errors';

import client from '../../lib/external-client';
import logger from '../../lib/logger';

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
 * Update the components status in components-service.
 * @param {array} components
 *  array of component ids to update
 * @param {string} status
 *  new status
 * @return {promise}
 */
const updateComponentStatus = async (components, status) => {

  const instance = client.init(process.env.COMPONENTS_SERVICE_URI);

  const updates = components.map(cid => {
    return instance.patch(`/components/${cid}`, { component: { status } });
  });

  await Promise.all(updates);

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
   * Auto updates any incidents ready to be started (in progress)
   */
  const autoUpdateScheduledIncidents = async () => {

    // find incidents to put in progress
    const pred = {
      type: 'scheduled',
      scheduled_status: 'scheduled',
      scheduled_auto_status_updates: true,
      scheduled_start_time: { $lte: new Date() }
    };

    let incidents = await dao.find(pred);

    // remove db prop _id
    incidents = incidents.map(_omit(['_id']));

    // first update all components to maintenance
    let componentsToUpdate = [];
    incidents.forEach(i => {
      componentsToUpdate.push(...i.components);
    });
    componentsToUpdate = _uniq(componentsToUpdate);

    await updateComponentStatus(componentsToUpdate, 'maintenance');

    // now add a new update to the incident and moving it to in-progress
    const baseData = {
      status: 'in_progress',
      message: 'The scheduled maintenance is in progress.'
    };

    const updates = incidents.map(i => {
      const updateData = Object.assign({}, baseData, {
        do_notify_subscribers: i.scheduled_auto_updates_send_notifications
      });
      return repo.update(i, updateData);
    });

    const updatedIncidents = await Promise.all(updates);

    // return the ids of incidents updated
    return updatedIncidents.map(i => {
      return i.id;
    });

  };

  /**
   * Auto updates any incidents ready to be completed
   */
  const autoUpdateInProgressIncidents = async () => {

    // find incidents to put in progress
    const pred = {
      type: 'scheduled',
      scheduled_status: 'in_progress',
      scheduled_auto_status_updates: true,
      scheduled_end_time: { $lte: new Date() }
    };

    let incidents = await dao.find(pred);

    // first update all components to operational
    let componentsToUpdate = [];
    incidents.forEach(i => {
      componentsToUpdate.push(...i.components);
    });
    componentsToUpdate = _uniq(componentsToUpdate);

    await updateComponentStatus(componentsToUpdate, 'operational');

    // remove db prop _id
    incidents = incidents.map(_omit(['_id']));

    // now add a new update to the incident and moving it to resolved
    const baseData = {
      status: 'resolved',
      message: 'The schedule maintenance is now completed.'
    };

    const updates = incidents.map(i => {
      const updateData = Object.assign({}, baseData, {
        do_notify_subscribers: i.scheduled_auto_updates_send_notifications
      });
      return repo.update(i, updateData);
    });

    const updatedIncidents = await Promise.all(updates);

    // return the ids of incidents updated
    return updatedIncidents.map(i => {
      return i.id;
    });

  };

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
      scheduled_auto_status_updates: false,
      scheduled_auto_updates_send_notifications: false
    };

    let incidentObj = Object.assign({}, defaultValues, _pick(props)(data), {
      type: INCIDENT_TYPE,
      scheduled_status: 'scheduled',
      updates: [incUpdateObj]
    });

    commonRepo.setResolvedStatus(incidentObj);

    validateStartEndTime(incidentObj);

    // save in db
    incidentObj = await commonRepo.saveDb(incidentObj);

    // fire for new incident-update
    await commonRepo.fireNewIncidentUpdate(incidentObj);

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
          scheduled: ['scheduled', 'in_progress', 'cancelled'],
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

    // a new incident-update added
    if (incidentObj.updates.length < updatedObj.updates.length) {
      // fire for new incident-update
      await commonRepo.fireNewIncidentUpdate(incidentObj);
    }

    return updatedObj;

  };

  /**
   * Auto-updates the incidents to in_progress or completed
   * based on some criteria. Usually this fn() is called from the
   * cron.
   */
  repo.autoUpdate = () => {

    return Promise.all([autoUpdateScheduledIncidents(), autoUpdateInProgressIncidents()])
      .then(r => {
        return { inProgress: r[0], completed: r[1] };
      })
      .catch(e => {
        logger.error(e);
        return { inProgress: [], completed: [] };
      });

  };

  return repo;

};


export default {
  init
};
