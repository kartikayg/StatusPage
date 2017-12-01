/**
 * @fileoverview
 */

import incident from './incident';

/**
 *
 */
const init = (db, messagingQueue) => {

  const incidentRepo = incident.init(db.dao('incidents'), messagingQueue);

  return {
    incident: incidentRepo
  };

};

export default { init };
