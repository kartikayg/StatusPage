/**
 * @fileoverview Shared code related to redux and state
 */

import _sortBy from 'lodash/fp/sortBy';
import _keyBy from 'lodash/fp/keyBy';
import _omit from 'lodash/fp/omit';
import _pick from 'lodash/fp/pick';
import _values from 'lodash/fp/values';
import _isEmpty from 'lodash/fp/isEmpty';
import _flow from 'lodash/fp/flow';
import _filter from 'lodash/fp/filter';
import _last from 'lodash/fp/last';
import _map from 'lodash/fp/map';

import moment from 'moment-timezone';

/**
 * Given a state, this function will return components combined with groups.
 * @param {object} state - redux state
 * @param {boolean} onlyActive
 * @return {array}
 */
export const getComponentsByGroup = (state, onlyActive = false) => {

  let workingCopy = [...state.components];

  // apply onlyActive
  if (onlyActive === true) {
    workingCopy = workingCopy.filter(c => {
      return c.active === true;
    });
  }

  // sort them
  workingCopy = _sortBy(['sort_order', 'created_by'])(workingCopy);

  // create object of group by keys
  const groupsById = _keyBy('id')(state.componentGroups);

  // now loop through the components and group by group id. if a group is not
  // found or no group_id, its a standalone component
  const cmpByGrp = {};

  workingCopy.forEach(c => {

    if (!c.group_id || !groupsById[c.group_id]) {
      cmpByGrp[c.id] = {
        group_id: null,
        group_name: null,
        components: [c]
      };
    }
    else {

      if (!cmpByGrp[c.group_id]) {
        cmpByGrp[c.group_id] = {
          group_id: c.group_id,
          group_name: groupsById[c.group_id].name,
          components: []
        };
      }

      cmpByGrp[c.group_id].components.push(c);

    }

  });

  return _values(cmpByGrp);

};

/**
 * @param {object} state - redux state
 * @return {array}
 */
export const fmtIncidents = (state) => {

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


    // latest update status
    if (i.type === 'realtime' && i.is_resolved === false) {

      data.latestUpdate = _flow(
        _filter(upd => {
          return upd.status !== 'update';
        }),
        _sortBy(['created_ts']),
        _last
      )(data.updates);

    }

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
export const filterRealtimeIncidents = (incidents, includeBackfilled = true) => {
  return _filter(i => {
    return i.type === 'realtime' || (includeBackfilled === true && i.type === 'backfilled');
  })(incidents);
};

/**
 * Filter scheduled incidents
 * @param {array} incidents
 * @return array
 */
export const filterScheduledIncidents = (incidents) => {
  return _filter(i => {
    return i.type === 'scheduled';
  })(incidents);
};

/**
 * Filter unresolved incidents
 * @param {array} incidents
 * @return array
 */
export const filterUnresolvedIncidents = (incidents) => {
  return _filter(i => {
    return i.is_resolved === false;
  })(incidents);
};
