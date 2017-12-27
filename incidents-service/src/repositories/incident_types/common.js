/**
 * @fileoverview Common functions between different types of incidents
 */

import _cloneDeep from 'lodash/fp/cloneDeep';
import _pick from 'lodash/fp/pick';
import _find from 'lodash/fp/find';

import { IdNotFoundError } from '../errors';
import { incident as incidentEntity, incidentUpdate as incidentUpdateEntity } from '../../entities/index';

/**
 * Init repo
 * @param {object} dao
 * @param {object} messagingQueue
 * @return {object}
 */
const init = (dao, messagingQueue) => {

  // repo object
  const repo = {};

  /**
   * Validate the incident object passed.
   * subscription object.
   * @param {object} data
   * @return {promise}
   *  on success, validated object
   *  on failure, validation error
   */
  repo.buildValidEntity = async (data) => {
    // build and validate entity
    const validEntity = await incidentEntity.validate(data);
    return validEntity;
  };

  /**
   * Saves an incident object in db
   * @param {object} incidentObj
   * @return {promise}
   *  on success, saved object
   *  on failure, error
   */
  repo.saveDb = async (incidentObj) => {

    const cloned = _cloneDeep(incidentObj);

    let isNew = false;

    // add id, if new
    if (!cloned.id) {
      isNew = true;
      cloned.id = incidentEntity.generateId();
      cloned.created_at = new Date();
    }

    cloned.updated_at = new Date();

    // validate
    const validEntity = await repo.buildValidEntity(cloned);

    if (isNew) {
      await dao.insert(validEntity);
    }
    else {
      await dao.update(validEntity, { id: validEntity.id });
    }

    return validEntity;

  };

  /**
   * Removes an subscription
   * @param {object} incidentObj
   * @return {promise}
   */
  repo.remove = async (incidentObj) => {

    const { id } = incidentObj;

    const cnt = await dao.remove({ id });
    if (cnt !== 1) {
      throw new IdNotFoundError(`Invalid incident object passed. ID: ${id}.`);
    }

  };

  /**
   * Builds an incident-update object from the data provided.
   * @param {object} data
   * @return {object}
   */
  repo.buildIncidentUpdateObj = (data) => {

    const defaultValues = {
      displayed_at: new Date(),
      do_notify_subscribers: false
    };

    // properties from data object
    const props = ['message', 'status', 'displayed_at', 'do_notify_subscribers'];

    // build object
    const obj = Object.assign({}, defaultValues, _pick(props)(data), {
      id: incidentUpdateEntity.generateId(),
      created_at: new Date(),
      updated_at: new Date()
    });

    return obj;

  };

  /**
   * Updates an incident update. The following fields are allowed to be updated
   *  1. displayed_at
   *  2. message
   * @param {object} incidentObj
   * @param {string} incidentUpdateId
   * @param {object} data
   * @return {promise}
   *  on success, incident object
   *  on failure, error
   */
  repo.changeIncidentUpdateEntry = async (incidentObj, incidentUpdateId, data) => {

    const cloned = _cloneDeep(incidentObj);

    // find update entry
    const currIncidentUpd = _find(['id', incidentUpdateId])(cloned.updates || []);
    if (!currIncidentUpd) {
      throw new IdNotFoundError(`No incident-update found for id: ${incidentUpdateId}.`);
    }

    // update incident-update. as its working from a cloned copy,
    // we can update it straight
    Object.assign(
      currIncidentUpd,
      _pick(['displayed_at', 'message'])(data),
      { updated_at: new Date() }
    );

    const saved = await repo.saveDb(cloned);

    return saved;

  };

  /**
   * Marks the incident obj resolved based on the last incicent-update
   * entry. This doesn't update the db, but only the object.
   * @param {object} incidentObj
   * @return {object}
   */
  repo.setResolvedStatus = (incidentObj) => {

    // already resolved
    if (incidentObj.is_resolved === true) {
      return incidentObj;
    }

    // check if any incident-update are resolved.
    const resolved = incidentObj.updates.find(u => {
      return u.status === 'resolved';
    });

    /* eslint-disable no-param-reassign */

    if (resolved) {
      incidentObj.is_resolved = true;
      incidentObj.resolved_at = new Date();
    }
    else {
      incidentObj.is_resolved = false;
      incidentObj.resolved_at = null;
    }

    /* eslint-enable no-param-reassign */

    return incidentObj;

  };

  /**
   * Fires a message on queue about a new incident-update
   * @param {object} incidentObj
   * @return {void}
   */
  repo.fireNewIncidentUpdate = async (incidentObj) => {

    // validate
    await repo.buildValidEntity(incidentObj);

    // fire away
    await messagingQueue.publish(incidentObj, 'incidents', { routingKey: 'new-update' });

  };

  return repo;

};

export default {
  init
};
