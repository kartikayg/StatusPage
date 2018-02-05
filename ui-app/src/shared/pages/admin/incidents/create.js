/**
 * @fileoverview
 */
import React from 'react';
import PropTypes from 'prop-types';

import NewRealtime from './realtime/create';

const NewIncident = (props) => {

  const type = props.match.params.type || 'realtime';

  return (
    <div>
      {type === 'realtime' && <NewRealtime {...props} />}
    </div>
  );
};

NewIncident.propTypes = {
  match: PropTypes.object.isRequired
};

export default NewIncident;