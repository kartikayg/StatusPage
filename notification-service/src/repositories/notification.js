/**
 * @fileoverview Repository to manage notification
 */

import _groupBy from 'lodash/fp/groupBy';
import _map from 'lodash/fp/map';

/**
 * Init repo.
 * @param {object} subscriptionRepo
 * @return {object}
 */
const init = (subscriptionRepo) => {

  // repo object
  const repo = {};

  /**
   *
   */
  repo.onNewIncidentUpdate = async (incidentObj) => {

    // find subscriptions for the components under this incident
    const subscriptions = subscriptionRepo.list({
      components: incidentObj.components
    });

    if (subscriptions.length === 0) {
      return;
    }

    // group subscriptions by type
    const subsByType = _groupBy('type')(subscriptions);

    // send notification. per type, call a fn with all the
    // subscriptions.
    const notify = (subs, t) => {
      return subscriptionRepo.ofType(t).notifyOfNewIncidentUpdate(subs);
    };
    await Promise.all(_map(notify)(subsByType));

  };

  return repo;

};

export default {
  init
};
