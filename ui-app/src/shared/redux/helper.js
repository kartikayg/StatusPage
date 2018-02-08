/**
 * @fileoverview Shared code related to redux and state
 */

import _sortBy from 'lodash/fp/sortBy';
import _keyBy from 'lodash/fp/keyBy';
import _values from 'lodash/fp/values';

/**
 * Given a state, this function will return components combined with groups.
 * @param {object} state - redux state
 * @param {boolean} onlyActive
 * @return {array}
 */
export const componentsByGroup = (state, onlyActive = false) => {

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
  const componentsByGroup = {};

  workingCopy.forEach(c => {

    if (!c.group_id || !groupsById[c.group_id]) {
      componentsByGroup[c.id] = {
        group_id: null,
        group_name: null,
        components: [c]
      };
    }
    else {

      if (!componentsByGroup[c.group_id]) {
        componentsByGroup[c.group_id] = {
          group_id: c.group_id,
          group_name: groupsById[c.group_id].name,
          components: []
        };
      }

      componentsByGroup[c.group_id].components.push(c);

    }

  });

  return _values(componentsByGroup);

};
