/**
 * @fileoverview Displays in progress incidents or a "all good" message
 * for the home page.
 */

import React from 'react';
import PropTypes from 'prop-types';

import { getHighestImpactStatus as getCmpHighestImpactStatus } from '../../redux/helpers/components';
import { getHighestImpactStatus as getIncHighestImpactStatus } from '../../redux/helpers/incidents';
import { statuses, getColor } from '../../presentation/component-status';
import IncidentView from './incident-view';

/**
 * Display in progess incidents
 * @prop {array} incidents
 */
const InprogressIncidents = ({ incidents }) => {

  const highestImpactStatus = getIncHighestImpactStatus(incidents);

  const contentTdStyle = {
    padding: '1.5rem 0 2rem 1.25rem',
    background: 'inherit',
    borderRadius: 'inherit',
    color: 'inherit'
  };

  return (
    <table className="ui table">
      <thead>
        <tr>
          <th className={`${getColor(highestImpactStatus)} ui message`} style={{ borderBottom: 'none' }}>
            Happening right now ({ incidents.length })
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={ contentTdStyle } className={`${getColor(highestImpactStatus)} ui message`}>
            {
              incidents.map((inc, idx) => {
                return (
                  <div style={{ marginTop: `${idx * 2.5}rem` }} key={inc.id}>
                    <IncidentView incident={inc} />
                  </div>
                );
              })
            }
          </td>
        </tr>
      </tbody>
    </table>
  );
};

InprogressIncidents.propTypes = {
  incidents: PropTypes.arrayOf(PropTypes.object).isRequired
};

/**
 * Main component
 * @prop {array} components
 * @prop {array} incidents
 */ 
const CurrentStatus = ({ components, incidents }) => {

  let body;

  // no incidents happening right now
  if (incidents.length === 0) {

    // any change in component status
    const highestCmpStatus = getCmpHighestImpactStatus(components);

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
        <div className="ui green message">
          <div className="header">
            All Systems operational
          </div>
        </div>
      );
    }
  }
  else {
    body = (
      <div style={{ paddingBottom: '2rem' }}>
        <InprogressIncidents incidents={incidents} />
      </div>
    );
  }

  return body;

};

CurrentStatus.propTypes = {
  components: PropTypes.arrayOf(PropTypes.object).isRequired,
  incidents: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default CurrentStatus;
