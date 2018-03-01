/**
 * @fileoverview
 */

import _sortBy from 'lodash/fp/sortBy';
import _keyBy from 'lodash/fp/keyBy';
import _omit from 'lodash/fp/omit';
import _pick from 'lodash/fp/pick';
import _isEmpty from 'lodash/fp/isEmpty';
import _flow from 'lodash/fp/flow';
import _filter from 'lodash/fp/filter';
import _last from 'lodash/fp/last';
import _map from 'lodash/fp/map';

import moment from 'moment-timezone';

const _pickBy = require('lodash/fp/pickBy').convert({ cap: false });


// statuses for incident
const statuses = {
  investigating: {
    displayName: 'Investigating',
    type: 'realtime'
  },
  identified: {
    displayName: 'Identified',
    type: 'realtime'
  },
  monitoring: {
    displayName: 'Monitoring',
    type: 'realtime'
  },
  scheduled: {
    displayName: 'Scheduled',
    type: 'scheduled'
  },
  in_progress: {
    displayName: 'In Progress',
    type: 'scheduled'
  },
  verifying: {
    displayName: 'Verifying',
    type: 'scheduled'
  },
  cancelled: {
    displayName: 'Cancelled',
    type: 'scheduled'
  },
  resolved: {
    displayName: 'Resolved'
  },
  update: {
    displayName: 'Update'
  }
};

// realtime statuses
const realtimeStatuses = _pickBy((v) => {
  return !v.type || v.type === 'realtime';
})(statuses);

const scheduledStatuses = _pickBy((v) => {
  return !v.type || v.type === 'scheduled';
})(statuses);

/**
 * @param {object} state - redux state
 * @return {array}
 */
const fmtIncidents = (state) => {

  const componentsByKey = _keyBy('id')(state.components);

  // format incidents and return
  const incidents = state.incidents.map(i => {

    const data = _omit(['components', 'updates'])(i);

    // fmt date props
    data.fmt_created_at = moment(data.created_at);
    data.fmt_modified_at = moment(data.modified_at);
    if (data.resolved_at) {
      data.fmt_resolved_at = moment(data.resolved_at);
    }

    if (data.scheduled_start_time) {
      data.fmt_scheduled_start_time = moment(data.scheduled_start_time);
    }

    if (data.scheduled_end_time) {
      data.fmt_scheduled_end_time = moment(data.scheduled_end_time);
    }

    // explode components information
    data.components = _flow(
      _filter(cid => {
        return _isEmpty(componentsByKey[cid]) === false;
      }),
      _map(cid => {
        return _pick(['id', 'name', 'status', 'active'])(componentsByKey[cid]);
      })
    )(i.components || []);


    // get the updates with some formatting
    data.updates = _map(upd => {

      const updData = { ...upd };

      // format dates
      updData.fmt_created_at = moment(upd.created_at);
      updData.fmt_displayed_at = moment(upd.displayed_at);

      return updData;

    })(i.updates || []);

    data.latestUpdate = _flow(
      _filter(upd => {
        return upd.status !== 'update';
      }),
      _sortBy(['created_ts']),
      _last
    )(data.updates);

    return data;

  });

  return incidents;

};

/**
 * Filter realtime incidents
 * @param {array} incidents
 * @param {boolean} includeBackfilled - whether to inlcude
 * backfilled incidents or not.
 * @return array
 */
const filterRealtimeIncidents = (incidents, includeBackfilled = true) => {
  return _filter(i => {
    return i.type === 'realtime' || (includeBackfilled === true && i.type === 'backfilled');
  })(incidents);
};

/**
 * Filter scheduled incidents
 * @param {array} incidents
 * @return array
 */
const filterScheduledIncidents = (incidents) => {
  return _filter(i => {
    return i.type === 'scheduled';
  })(incidents);
};

/**
 * Filter unresolved incidents
 * @param {array} incidents
 * @return array
 */
const filterUnresolvedIncidents = (incidents) => {
  return _filter(i => {
    return i.is_resolved === false;
  })(incidents);
};

/**
 * Filter resolved incidents
 * @param {array} incidents
 * @return array
 */
const filterResolvedIncidents = (incidents) => {
  return _filter(i => {
    return i.is_resolved === true;
  })(incidents);
};

/**
 * Filter out in-progress scheduled incidents
 * @param {array} incidents
 * @return array
 */
const filterInprogressScheduledIncidents = (incidents) => {
  return _flow(
    filterScheduledIncidents,
    _filter(i => {
      return i.scheduled_status === 'in_progress';
    })
  )(incidents);
};

/**
 * Filter out upcoming scheduled incidents
 * @param {array} incidents
 * @return array
 */
const filterUpcomingScheduledIncidents = (incidents) => {
  return _flow(
    filterScheduledIncidents,
    _filter(i => {
      return i.scheduled_status === 'scheduled';
    })
  )(incidents);
};

/**
 * Filter out completed/cancelled scheduled incidents
 * @param {array} incidents
 * @return array
 */
const filterCompletedScheduledIncidents = (incidents) => {
  return _flow(
    filterScheduledIncidents,
    _filter(i => {
      return ['completed', 'cancelled'].indexOf(i.scheduled_status) !== -1;
    })
  )(incidents);
};

/**
 * Given a list of unresolved incidents, return what
 * is the highest component impact status.
 * @param {array} unresolvedIncidents
 * @return {string}
 */
const getHighestImpactStatus = (unresolvedIncidents) => {

  if (unresolvedIncidents.length === 0) {
    return '';
  }

  const order = [
    'operational',
    'maintenance',
    'degraded_performance',
    'partial_outage',
    'major_outage'
  ];

  const sts = unresolvedIncidents.map(i => {
    return (i.type === 'scheduled')
      ? 'maintenance'
      : i.components_impact_status || 'operational';
  });

  return sts.reduce((hStatus, cStatus) => {
    // find position of the statuses and return the highest
    const hPos = order.indexOf(hStatus);
    const cPos = order.indexOf(cStatus);
    return hPos > cPos ? hStatus : cStatus;
  }, sts[0]);

};

export {
  statuses, realtimeStatuses, scheduledStatuses,
  fmtIncidents,
  filterRealtimeIncidents,
  filterScheduledIncidents,
  filterResolvedIncidents,
  filterUnresolvedIncidents,
  getHighestImpactStatus,
  filterInprogressScheduledIncidents,
  filterUpcomingScheduledIncidents,
  filterCompletedScheduledIncidents
};

