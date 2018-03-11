/**
 * @fileoverview
 */

import React from 'react';
import moment from 'moment-timezone';
import PropTypes from 'prop-types';

import IncidentView from './incident-view';

const IncidentDay = ({ date, incidents }) => {

  return (
    <div className="ui text container">
      <h3 className="ui dividing header">
        {date.format('MMMM Do, YYYY')}
      </h3>
      {
        incidents.length === 0 && (
          <div style={{ color: 'gray' }}>
            <p>No incidents reported</p>
          </div>
        )
      }
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

IncidentDay.propTypes = {
  incidents: PropTypes.arrayOf(PropTypes.object).isRequired,
  date: PropTypes.object.isRequired
};

const PastIncidents = ({ incidents }) => {

  // last 2 weeks
  const howManyDays = Array.from(Array(14).keys());

  return (
    <div>
      <h2 className="ui header">Past Incidents</h2>
      {
        howManyDays.map(d => {
          const thisDate = moment().subtract(d, 'days');
          const resolvedIncidents = incidents.filter(i => {
            return i.is_resolved && thisDate.format('YYYY-MM-DD') === i.fmt_resolved_at.format('YYYY-MM-DD');
          });
          return <IncidentDay date={thisDate} incidents={resolvedIncidents} key={d} />;
        })
      }
    </div>
  );
};

PastIncidents.propTypes = {
  incidents: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default PastIncidents;
