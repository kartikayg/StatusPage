/**
 * @fileoverview Presentational component: Listing of components
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const Listing = ({ components }) => {

  let body;

  if (components.length === 0) {
    body = (
      <div>
        <p><strong>No components found</strong></p>
      </div>
    );
  }
  else {

  }

  return (

    <div>

      <h1 className="ui header">Components</h1>

      <div style={{ margin: '2rem 0' }}>
        <Link to='/admin/components/add'>
          <button className="positive ui button">
            Add Component
          </button>
        </Link>
      </div>

      {body}

    </div>

  );

};

Listing.propTypes = {
  components: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default Listing;
