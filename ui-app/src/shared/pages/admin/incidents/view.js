/**
 * @fileoverview Shell for viewing an incident. This will render
 * the correct component based on the type.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';

import ViewRealtimeIncident from './realtime/view';
import ViewBackfilledIncident from './backfilled/view';

const ViewIncident = (props) => {
  return (
    <div>
      <Helmet>
        <title>{props.incident.name}</title>
      </Helmet>
      {props.incident.type === 'realtime' && <ViewRealtimeIncident {...props} />}
      {props.incident.type === 'backfilled' && <ViewBackfilledIncident {...props} />}
    </div>
  );
};

ViewIncident.propTypes = {
  incident: PropTypes.object.isRequired,
  components: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default ViewIncident;
