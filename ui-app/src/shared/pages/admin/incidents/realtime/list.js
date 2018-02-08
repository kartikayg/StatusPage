/**
 * @fileoverview
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import _sortBy from 'lodash/fp/sortBy';

import { filterUnresolvedIncidents } from '../../../../redux/helper';

import UnresolvedListing from './list/unresolved';

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

    const unresolved = _sortBy(['created_ts'])(filterUnresolvedIncidents(incidents));

    body = (
      <div>
        {
          unresolved.length > 0 &&
          <UnresolvedListing incidents={filterUnresolvedIncidents(incidents)} />
        }
      </div>
    );
  }

  return (
    <div>
      <div style={{ margin: '2rem 0' }}>
        <Link to='/admin/incidents/add' className='positive ui button'>
          Add Incident
        </Link>
        <div style={{ paddingTop: '7px' }}>
          Need to record an incident that occurred in the past?{' '}
          <Link to='/admin/incidents/add/backfilled'>Backfill an Incident</Link>
        </div>
      </div>
      {body}
    </div>
  );

};

Listing.propTypes = {
  incidents: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default Listing;
