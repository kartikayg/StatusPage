/**
 * @fileoverview
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const Listing = ({ incidents }) => {

  let body;

  // if no components found
  if (incidents.length === 0) {
    body = (
      <div>
        <p><strong>No incidents found</strong></p>
      </div>
    );
  }
  else {
    body = (
      <div></div>
    );
  }

  return (
    <div>
      <div style={{ margin: '2rem 0' }}>
        <Link to='/admin/incidents/add/maintenance' className='positive ui button'>
          Add Scheduled Maintenance
        </Link>
      </div>
      {body}
    </div>
  );

};

Listing.propTypes = {
  incidents: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default Listing;
