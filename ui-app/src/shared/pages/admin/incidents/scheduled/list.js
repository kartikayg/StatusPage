/**
 * @fileoverview
 */

import React from 'react';
import PropTypes from 'prop-types';

const Listing = ({ incidents }) => {
  return (
    <div>Scheduled Maintenance</div>
  );
};

Listing.propTypes = {
  incidents: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default Listing;
