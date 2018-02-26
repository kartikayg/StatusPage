/**
 * @fileoverview Shell for editing an incident. This will render
 * the correct component based on the incident type.
 */
import React from 'react';
import PropTypes from 'prop-types';

import EditRealtimeIncident from './realtime/edit';
import EditScheduledIncident from './scheduled/edit';

const EditIncident = (props) => {
  return (
    <div>
      { props.incident.type === 'realtime' && <EditRealtimeIncident {...props} /> }
      { props.incident.type === 'scheduled' && <EditScheduledIncident {...props} /> }
    </div>
  );
};

EditIncident.propTypes = {
  incident: PropTypes.object.isRequired,
  components: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default EditIncident;
