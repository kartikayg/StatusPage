/**
 * @fileoverview
 */

import React from 'react';
import PropTypes from 'prop-types';

import { getHighestImpactStatus } from '../../redux/helpers/components';
import { statuses } from '../../presentation/component-status';

const CurrentStatus = ({ components, incidents }) => {

  let body;

  // no incidents happening right now
  if (incidents.length === 0) {

    // any change in component status
    const highestCmpStatus = getHighestImpactStatus(components);

    if (highestCmpStatus !== '' && highestCmpStatus !== 'operational') {
      body = (
        <div className={`ui ${statuses[highestCmpStatus].color} message`}>
          <div className="header">
            {statuses[highestCmpStatus].displayName}
          </div>
        </div>
      );
    }
    else {
      body = (
        <div className="ui success message">
          <div className="header">
            All Systems operational
          </div>
        </div>
      );
    }
  }
  else {

  }

  return body;

};

CurrentStatus.propTypes = {
  components: PropTypes.arrayOf(PropTypes.object).isRequired,
  incidents: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default CurrentStatus;
