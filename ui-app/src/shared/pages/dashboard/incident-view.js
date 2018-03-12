/**
 * @fileoverview
 */

import React from 'react';
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
       <h3 className={`ui ${getColor(impactStatus)} header`} style={{ marginBottom: '1rem' }}>
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
          incident={incident}
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

export default IncidentView;
