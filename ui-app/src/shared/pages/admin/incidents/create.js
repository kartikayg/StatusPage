/**
 * @fileoverview Shell for creating a new incident. This will render
 * the correct component based on the incident type.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';

import NewRealtime from './realtime/create';
import NewBackfilled from './backfilled/create';
import NewMaintenance from './scheduled/create';

const NewIncident = (props) => {

  const type = props.match.params.type || 'realtime';

  return (
    <div>
      <Helmet>
        <title>New Incident</title>
      </Helmet>
      { type === 'realtime' && <NewRealtime {...props} /> }
      { type === 'backfilled' && <NewBackfilled {...props} /> }
      { type === 'scheduled' && <NewMaintenance {...props} /> }
    </div>
  );
};

NewIncident.propTypes = {
  match: PropTypes.object.isRequired,
  components: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default NewIncident;
