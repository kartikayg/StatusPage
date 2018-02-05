/**
 * @fileoverview
 */

import React from 'react';
import PropTypes from 'prop-types';

import Form from './form';

const NewIncident = ({ components }) => {
  return (
    <div>
      <h1 className="ui header">New Incident</h1>
      <div style={{ marginTop: '2rem' }}>
        <Form components={components} />
      </div>
    </div>
  );
};

NewIncident.propTypes = {
  components: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default NewIncident;
