/**
 * @fileoverview
 */

import React from 'react';
import PropTypes from 'prop-types';

const SummarizedMessage = ({ components, incidents }) => {
  return (
    <div className="ui success message">
      <div className="header">
        All Systems operational
      </div>
    </div>
  );
};

SummarizedMessage.propTypes = {
  components: PropTypes.arrayOf(PropTypes.object).isRequired,
  incidents: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default SummarizedMessage;
