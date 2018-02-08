/**
 * @fileoverview Presentation components for component-status.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Dropdown, Icon } from 'semantic-ui-react';

const _map = require('lodash/fp/map').convert({ cap: false });

// list of statuses
export const statuses = {
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
export const getColor = (status) => {
  return statuses[status] ? statuses[status].color : 'green';
};

/**
 * Return the icon element to use to show the status
 */
export const StatusIcon = ({ status }) => {
  return (
    <Icon color={getColor(status)} name='circle' />
  );
};

StatusIcon.propTypes = {
  status: PropTypes.string.isRequired
};

/**
 * Return the icon element to use to show the status
 */
export const StatusIconWithText = ({ status }) => {
  return (
    <div><StatusIcon status={status} /> {statuses[status].displayName}</div>
  );
};

StatusIconWithText.propTypes = {
  status: PropTypes.string.isRequired
};

/**
 * Select for statuses
 */
export const StatusDropDown = (props) => {

  const options = _map((val, k) => {
    return {
      value: k,
      text: (<div><StatusIcon status={k} /> {val.displayName}</div>)
    };
  })(statuses);

  if (props.optional === true) {
    options.unshift({
      value: '',
      text: '-- Select a value --'
    });
  }

  return (
    <Dropdown
      closeOnBlur
      closeOnChange
      fluid
      selection
      options={options}
      value={props.value}
      onChange={props.onChange}
      selectOnBlur={false}
      disabled={props.readOnly || false}
      name={props.name}
      placeholder='-- Select a value --'
    />
  );

};

StatusDropDown.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  readOnly: PropTypes.bool,
  name: PropTypes.string.isRequired,
  optional: PropTypes.bool
};

// Specifies the default values for props:
StatusDropDown.defaultProps = {
  name: 'component-status'
};

