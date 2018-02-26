/**
 * @fileoverview Creates a new scheduled incident
 */

import React from 'react';
import { Helmet } from 'react-helmet';

import Form from './form';

const NewMaintenance = (props) => {
  return (
    <div>
      <Helmet>
        <title>New Scheduled Maintenance</title>
      </Helmet>
      <h1 className="ui header">New Maintenance</h1>
      <div style={{ marginTop: '2rem' }}>
        <Form {...props} />
      </div>
    </div>
  );
};

export default NewMaintenance;
