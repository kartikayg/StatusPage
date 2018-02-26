/**
 * @fileoverview List of realtime incidents
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import _sortBy from 'lodash/fp/sortBy';

import { filterUnresolvedIncidents, filterResolvedIncidents } from '../../../../redux/helpers/incidents';

import UnresolvedListing from './list/unresolved';
import ResolvedListing from './list/resolved';

const Listing = ({ incidents, onDeleteIncidentClick }) => {

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

    // group by unresolved and resolved
    const unresolved = _sortBy(['created_at'])(filterUnresolvedIncidents(incidents));
    const resolved = _sortBy(['resolved_at'])(filterResolvedIncidents(incidents));

    body = (
      <div>
        {
          unresolved.length > 0 &&
          (
            <div style={{ marginBottom: '3rem' }}>
              <UnresolvedListing
                incidents={unresolved}
                onDeleteIncidentClick={onDeleteIncidentClick}
              />
            </div>
          )
        }
        {
          resolved.length > 0 &&
          (
            <div>
              <ResolvedListing
                incidents={resolved}
                onDeleteIncidentClick={onDeleteIncidentClick}
              />
            </div>
          )
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
  incidents: PropTypes.arrayOf(PropTypes.object).isRequired,
  onDeleteIncidentClick: PropTypes.func.isRequired
};

export default Listing;
