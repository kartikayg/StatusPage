/**
 * @fileoverview Listing of Inprogress maintenance
 */

import React from 'react';
import PropTypes from 'prop-types';

import { getColor } from '../../../../../presentation/component-status';
import { IncidentRow } from '../../realtime/list/unresolved';

const InprogressListing = ({ incidents, onDeleteIncidentClick }) => {
  return (
    <table className="ui celled striped table large">
      <thead>
        <tr>
          <th colSpan="3" style={{ color: getColor('maintenance') }}>
            In Progress ({incidents.length})
          </th>
        </tr>
      </thead>
      <tbody>
        {incidents.map(i => {
          return <IncidentRow
            key={i.id}
            incident={i}
            onDeleteIncidentClick={onDeleteIncidentClick}
          />;
        })}
      </tbody>
    </table>
  );
};

InprogressListing.propTypes = {
  incidents: PropTypes.arrayOf(PropTypes.object).isRequired,
  onDeleteIncidentClick: PropTypes.func.isRequired
};

export default InprogressListing;
