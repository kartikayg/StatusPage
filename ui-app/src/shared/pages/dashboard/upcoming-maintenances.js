/**
 * @fileoverview
 */

import React from 'react';
import PropTypes from 'prop-types';

import IncidentView from './incident-view';

const UpcomingMaintenances = ({ incidents }) => {
  return (
    <div>
      <h2 className="ui header" style={{ marginBottom: '2rem' }}>
        Upcoming Schedule Maintenances
      </h2>
      {
        incidents.map((inc, idx) => {
          return (
            <div style={{ marginTop: `${idx * 2.5}rem` }} key={inc.id}>
              <IncidentView incident={inc} />
            </div>
          );
        })
      }
    </div>
  );
};

UpcomingMaintenances.propTypes = {
  incidents: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default UpcomingMaintenances;
