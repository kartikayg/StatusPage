/**
 * @fileoverview
 */

import React from 'react';
import PropTypes from 'prop-types';

import Form from './form';

const NewIncident = (props) => {
  return (
    <div>
      <h1 className="ui header">New Incident</h1>
      <div style={{ marginTop: '2rem' }}>
        <Form
          components={props.components}
          onComponentStatusUpdate={props.updateComponentStatus}
          onNewIncident={props.addIncident}
        />
      </div>
    </div>
  );
};

NewIncident.propTypes = {
  components: PropTypes.arrayOf(PropTypes.object).isRequired,
  updateComponentStatus: PropTypes.func.isRequired,
  addIncident: PropTypes.func.isRequired
};

export default NewIncident;
