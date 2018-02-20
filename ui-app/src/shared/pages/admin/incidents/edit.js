/**
 * @fileoverview Shell for editing an incident. This will render
 * the correct component based on the type.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';

import EditRealtimeIncident from './realtime/edit';

const EditIncident = (props) => {
  return (
    <div>
      <Helmet>
        <title>Edit Incident</title>
      </Helmet>
      {props.incident.type === 'realtime' && <EditRealtimeIncident {...props} />}
    </div>
  );
};

EditIncident.propTypes = {
  incident: PropTypes.object.isRequired,
  components: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default EditIncident;
