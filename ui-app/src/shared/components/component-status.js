/**
 * @fileoverview
 */

import React from 'react';
import PropTypes from 'prop-types';

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

// return the icon used based on the status
const Icon = ({ status }) => {
  return <i className={`${getColor(status)} circle icon`}></i>;
};

Icon.propTypes = {
  status: PropTypes.string.isRequired
};

export { Icon };
