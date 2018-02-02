/**
 * @fileoverview Presentation component for component status.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Dropdown, Icon } from 'semantic-ui-react';

const _map = require('lodash/fp/map').convert({ cap: false });

// list of statuses
const statuses = {
  operational: {
    displayName: 'Operational',
    color: 'green'
  },
  degraded_performance: {
    displayName: 'Degraded Performance',
    color: 'yellow'
  },
  partial_outage: {
    displayName: 'Partial Outage',
    color: 'orange'
  },
  major_outage: {
    displayName: 'Major Outage',
    color: 'red'
  },
  maintenance: {
    displayName: 'Maintenance',
    color: 'blue'
  }
};

/**
 * Returns the color based on the status
 * @param {string} status
 * @return {string}
 */
const getColor = (status) => {
  return statuses[status] ? statuses[status].color : 'green';
};

/**
 * Return the icon element to use to show the status
 */
const StatusIcon = ({ status }) => {
  return (
    <Icon color={getColor(status)} name='circle' />
  );
};

StatusIcon.propTypes = {
  status: PropTypes.string.isRequired
};

/**
 * Select for statuses
 */
const StatusDropDown = ({ onChange, value }) => {

  const options = _map((val, k) => {
    return {
      value: k,
      text: (<div><StatusIcon status={k} /> {val.displayName}</div>)
    };
  })(statuses);

  return (
    <Dropdown
      closeOnBlur
      closeOnChange
      fluid
      selection
      options={options}
      value={value}
      onChange={onChange}
      selectOnBlur={false}
    />
  );

};

StatusDropDown.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired
};

export { StatusIcon, StatusDropDown };
