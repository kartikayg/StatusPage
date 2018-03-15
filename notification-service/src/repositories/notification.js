/**
 * @fileoverview Repository to manage notifications
 */

import _groupBy from 'lodash/fp/groupBy';

const _map = require('lodash/fp/map').convert({ cap: false });

/**
 * Init repo.
 * @param {object} subscriptionRepo
 * @return {object}
 */
const init = (subscriptionRepo) => {

  // repo object
  const repo = {};

  /**
   * For a new incident-update, notify on subscriptions.
   * @param {object} incidentObj
   */
  repo.onNewIncidentUpdate = async (incidentObj) => {

    if (!incidentObj || !incidentObj.updates) {
      return;
    }

    // get the last incident-update
    const latestUpdate = incidentObj.updates[incidentObj.updates.length - 1];

    if (!latestUpdate || latestUpdate.do_notify_subscribers !== true) {
      return;
    }

    // find subscriptions for the components under this incident
    const subscriptions = await subscriptionRepo.list({
      components: incidentObj.components,
      is_confirmed: true
    });

    if (subscriptions.length === 0) {
      return;
    }

    // group subscriptions by type
    const subsByType = _groupBy('type')(subscriptions);

    // send notification. per type, call a fn with all the
    // subscriptions.
    const notify = (subs, t) => {
      return subscriptionRepo.ofType(t).then(tRepo => {
        return tRepo.notifyOfNewIncidentUpdate(incidentObj, subs);
      });
    };

    await Promise.all(_map(notify)(subsByType));

  };

  return repo;

};

export default {
  init
};
