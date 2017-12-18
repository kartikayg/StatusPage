/**
 * @fileoverview Repository to manage subcription
 */

import Joi from 'joi';

import _omit from 'lodash/fp/omit';
import { IdNotFoundError, InvalidSubscriptionTypeError } from './errors';

// {array} valid subscription types
const validTypes = ['email', 'webhook'];

/**
 * Formats an subscriber object from the db. It removes
 * any data points specific to the db.
 * @param {object} subscriberDb
 * @return {object}
 */
const format = (subscriberDb) => {
  return _omit(['_id'])(subscriberDb);
};


/**
 * Init repo. This exposes some generic functions (regardless of type of subscription)
 * and provides a way to access specific subscription type repo.
 * @param {object} dao
 * @return {object}
 */
const init = (dao) => {

  if (dao.name !== 'subscriptions') {
    throw new Error(`Invalid DAO passed to this repo. Passed dao name: ${dao.name}`);
  }

  // caches the repo for each type
  const typesRepo = [];

  // repo object.
  const repo = {};

  /**
   * Returns a list of subscriptions based on filters
   * @param {object} filter. no field is required. allowed fields:
   *   type
   *   is_confirmed
   *   components - return subscriptions that have either no
   *   components or that have any of the components passed.
   * @return {Promise}
   *  if fulfilled, {array} array of subscriptions
   *  if rejected, {Error} error
   */
  repo.list = async (filter = {}) => {

    // validate passed filters
    const {error, value: validFilters} = Joi.validate(filter, {
      type: Joi.string(),
      is_confirmed: Joi.boolean(),
      components: Joi.array().items(Joi.string()).single()
    }, { allowUnknown: true, abortEarly: false, stripUnknown: true });

    if (error) {
      throw error;
    }

    // build the predicate using sanitized filters

    const pred = {};

    Object.keys(validFilters).forEach(k => {

      switch (k) {
        case 'type':
        case 'is_confirmed':
          pred[k] = validFilters[k];
          break;
        case 'components': {
          pred.$or = [
            // first filter subscriptions with no set components
            { components: { $exists: true, $eq: [] } },
            // then subscription with any of the component
            ...validFilters[k].map(cmp => {
              return { components: cmp };
            })
          ];
          break;
        }
        default:
          break;
      }

    });

    // sort by id
    const sortBy = { _id: 1 };

    const subscriptions = await dao.find(pred, sortBy);
    return subscriptions.map(format);

  };

  /**
   * Loads a subscription object.
   * @param {string} id - subscription id
   * @return {Promise}
   *  if fulfilled, {object} subscription object
   *  if rejected, {Error} error
   */
  repo.load = async (id) => {

    const data = await dao.find({ id });

    if (data.length !== 1) {
      throw new IdNotFoundError(`Invalid subscription id passed: ${id}.`);
    }

    return format(data[0]);

  };

  /**
   * Returns a repo for a given subscription type.
   * @param {string} type
   * @return {Promise}
   *  if success, repo object
   *  if failed, error
   */
  repo.ofType = (type) => {

    // validate type
    if (validTypes.includes(type) === false) {
      return Promise.reject(new InvalidSubscriptionTypeError(type));
    }

    // if not cached, get it
    if (!typesRepo[type]) {
      typesRepo[type] = require(`./subscription_types/${type}`).init(dao); // eslint-disable-line
    }

    return Promise.resolve(typesRepo[type]);

  };

  return repo;

};

export default {
  init,
  validTypes
};
