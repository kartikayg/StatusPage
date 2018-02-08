/**
 * @fileoverview
 */

import React from 'react';

import Form from './form';

const NewIncident = (props) => {
  return (
    <div>
      <h1 className="ui header">New Incident</h1>
      <div style={{ marginTop: '2rem' }}>
        <Form {...props} />
      </div>
    </div>
  );
};

export default NewIncident;
