/**
 * @fileoverview Shell for creating a new incident. This will render
 * the correct component based on the type.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';

import NewRealtime from './realtime/create';
import NewBackfilled from './backfilled/create';

const NewIncident = (props) => {

  const type = props.match.params.type || 'realtime';

  return (
    <div>
      <Helmet>
        <title>New Incident</title>
      </Helmet>
      {type === 'realtime' && <NewRealtime {...props} />}
      {type === 'backfilled' && <NewBackfilled {...props} />}
    </div>
  );
};

NewIncident.propTypes = {
  match: PropTypes.object.isRequired
};

export default NewIncident;
