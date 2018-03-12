/**
 * @fileoverview List of scheduled maintenances
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import _sortBy from 'lodash/fp/sortBy';
import _orderBy from 'lodash/fp/orderBy';
import _flow from 'lodash/fp/flow';

import {
  filterUpcomingScheduledIncidents,
  filterCompletedScheduledIncidents,
  filterInprogressScheduledIncidents
} from '../../../../redux/helpers/incidents';

import InprogressListing from './list/inprogress';
import UpcomingListing from './list/upcoming';
import CompletedListing from './list/completed';


const Listing = ({ incidents, onDeleteIncidentClick }) => {

  /* eslint-disable function-paren-newline */

  let body;

  // if no components found
  if (incidents.length === 0) {
    body = (
      <div>
        <p><strong>No maintenances found</strong></p>
      </div>
    );
  }
  else {

    // group by in progess, what is upcoming and what is completed/cancelled

    const inprogress = _flow(
      filterInprogressScheduledIncidents, _sortBy(['scheduled_end_time'])
    )(incidents);

    const upcoming = _flow(
      filterUpcomingScheduledIncidents, _sortBy(['scheduled_start_time'])
    )(incidents);

    const completed = _flow(
      filterCompletedScheduledIncidents, _orderBy(['resolved_at'])(['desc'])
    )(incidents);

    body = (
      <div>
        {
          inprogress.length > 0 &&
          (
            <div style={{ marginBottom: '3rem' }}>
              <InprogressListing
                incidents={inprogress}
                onDeleteIncidentClick={onDeleteIncidentClick}
              />
            </div>
          )
        }
        {
          upcoming.length > 0 &&
          (
            <div style={{ marginBottom: '3rem' }}>
              <UpcomingListing
                incidents={upcoming}
                onDeleteIncidentClick={onDeleteIncidentClick}
              />
            </div>
          )
        }
        {
          completed.length > 0 &&
          (
            <div style={{ marginBottom: '3rem' }}>
              <CompletedListing
                incidents={completed}
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
      <Helmet>
        <title>Scheduled Maintenance</title>
      </Helmet>
      <div style={{ margin: '2rem 0' }}>
        <Link to='/admin/incidents/add/scheduled' className='positive ui button'>
          Add Scheduled Maintenance
        </Link>
      </div>
      {body}
    </div>
  );

  /* eslint-enable function-paren-newline */

};

Listing.propTypes = {
  incidents: PropTypes.arrayOf(PropTypes.object).isRequired,
  onDeleteIncidentClick: PropTypes.func.isRequired
};

export default Listing;
