/**
 * @fileoverview Editing realtime incident
 */

import React from 'react';
import PropTypes from 'prop-types';

import Form from './form';
import { getColor } from '../../../../presentation/component-status';

const EditRealtimeIncident = (props) => {
  return (
    <div>
      <h1 className="ui header" style={{ color: getColor(props.incident.components_impact_status) }}>
        {props.incident.name}
      </h1>
      <div style={{ marginTop: '-10px', fontStyle: 'italic' }}>
        Add a new message, update status or impacted components.
      </div>
      <div style={{ marginTop: '2rem' }}>
        <Form {...props} />
      </div>
    </div>
  );
};

EditRealtimeIncident.propTypes = {
  incident: PropTypes.object.isRequired
};

export default EditRealtimeIncident;
