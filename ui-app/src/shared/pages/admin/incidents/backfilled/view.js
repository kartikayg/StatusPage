/**
 * @fileoverview
 */

import React from 'react';
import PropTypes from 'prop-types';
import _orderBy from 'lodash/fp/orderBy';

import { getColor } from '../../../../presentation/component-status';
import IncidentUpdates from '../incident-updates';

const ViewBackfilledIncident = (props) => {

  return (
    <div>
       <h1 className="ui header" style={{ color: getColor(props.incident.components_impact_status) }}>
        {props.incident.name}
      </h1>
      <div style={{ marginTop: '1.25rem' }}>
        <IncidentUpdates
          incidentId={props.incident.id}
          updates={_orderBy(['created_at'])(['desc'])(props.incident.updates)}
          updateIncidentAction={props.updateIncidentAction}
        />
      </div>
    </div>
  );
};

ViewBackfilledIncident.propTypes = {
  incident: PropTypes.object.isRequired,
  updateIncidentAction: PropTypes.func.isRequired
};

export default ViewBackfilledIncident;
