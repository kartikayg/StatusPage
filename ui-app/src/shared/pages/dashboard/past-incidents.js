/**
 * @fileoverview
 */

import React from 'react';
import moment from 'moment-timezone';
import PropTypes from 'prop-types';
import _orderBy from 'lodash/fp/orderBy';

import { getColor } from '../../presentation/component-status';
import IncidentUpdates from '../admin/incidents/incident-updates';

const IncidentView = ({ incident }) => {

  let impactStatus = incident.components_impact_status;
  if (incident.type === 'scheduled') {
    impactStatus = 'maintenance';
  }

  return (
    <div>
       <h3 className={`ui ${getColor(impactStatus)} header`}>
        {incident.name}
      </h3>
      <div>
        {incident.components.map(c => {
          return (
            <div className="ui horizontal label large" key={c.id}>{c.name}</div>
          );
        })}
      </div>
      <div style={{ marginTop: '1rem' }}>
        <IncidentUpdates
          incidentId={incident.id}
          updates={_orderBy(['created_at'])(['desc'])(incident.updates)}
          allowNewUpdate={false}
          allowEdits={false}
        />
      </div>
    </div>
  );
};

IncidentView.propTypes = {
  incident: PropTypes.object.isRequired
};


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
