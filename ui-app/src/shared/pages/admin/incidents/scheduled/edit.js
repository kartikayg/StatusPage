/**
 * @fileoverview Editing scheduled incident
 */

import React from 'react';
import PropTypes from 'prop-types';
import _orderBy from 'lodash/fp/orderBy';
import { Helmet } from 'react-helmet';

import Form from './form';
import IncidentUpdates from '../incident-updates';

const EditScheduledIncident = (props) => {
  return (
    <div>
      <Helmet>
        <title>Edit Scheduled Maintenance</title>
      </Helmet>
      <h1 className="ui header">
        {props.incident.name}
      </h1>
      <div style={{ marginTop: '-10px', fontStyle: 'italic' }}>
        Add a new message, update status or impacted components.
      </div>
      <div style={{ marginTop: '2rem' }}>
        <Form {...props} />
      </div>
      <div className="ui horizontal divider" style={{ marginTop: '3rem' }}>
        Previous Updates
      </div>
      <div style={{ marginTop: '1.5rem' }}>
        <IncidentUpdates
          incident={props.incident}
          updates={_orderBy(['created_at'])(['desc'])(props.incident.updates)}
          updateIncidentAction={props.updateIncidentAction}
        />
      </div>
    </div>
  );
};

EditScheduledIncident.propTypes = {
  incident: PropTypes.object.isRequired,
  updateIncidentAction: PropTypes.func.isRequired
};

export default EditScheduledIncident;
