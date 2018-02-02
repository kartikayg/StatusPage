/**
 * @fileoverview Presentation component for component status.
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * Returns the color based on the status
 * @param {string} status
 * @return {string}
 */
const getColor = (status) => {
  switch (status) {
    case 'degraded_performance':
      return 'yellow';
    case 'partial_outage':
      return 'orange';
    case 'major_outage':
      return 'red';
    case 'maintenance':
      return 'blue';
    case 'operational':
    default:
      return 'green';
  }
};

/**
 * Return the icon element to use to show the status
 */
const Icon = ({ status }) => {
  return <i className={`${getColor(status)} circle icon`}></i>;
};

Icon.propTypes = {
  status: PropTypes.string.isRequired
};

export { Icon };
