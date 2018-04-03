/**
 * @fileoverview View a single realtime incident
 */

import React from 'react';
import PropTypes from 'prop-types';
import _orderBy from 'lodash/fp/orderBy';

import { getColor } from '../../../../presentation/component-status';
import IncidentUpdates from '../incident-updates';

const ViewRealtimeIncident = (props) => {

  return (
    <div>
       <h1 className={`ui header ${getColor(props.incident.components_impact_status)}`}>
        {props.incident.name}
      </h1>
      <div>
        {props.incident.components.map(c => {
          return (
            <div className="ui horizontal label large" key={c.id}>{c.name}</div>
          );
        })}
      </div>
      <div className="ui horizontal divider" style={{ marginTop: '1.5rem' }}>
        Updates
      </div>
      <div style={{ marginTop: '1.5rem' }}>
        <IncidentUpdates
          incident={props.incident}
          updates={_orderBy(['created_at'])(['desc'])(props.incident.updates)}
          updateIncidentAction={props.updateIncidentAction}
          allowNewUpdate={true}
        />
      </div>
    </div>
  );
};

ViewRealtimeIncident.propTypes = {
  incident: PropTypes.object.isRequired,
  updateIncidentAction: PropTypes.func.isRequired
};

export default ViewRealtimeIncident;
