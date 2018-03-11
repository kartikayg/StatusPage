/**
 * @fileoverview Listing of unresolved incidents
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { statuses, getHighestImpactStatus } from '../../../../../redux/helpers/incidents';
import { StatusIconWithText, StatusIcon, getColor } from '../../../../../presentation/component-status';

// Table row
const IncidentRow = ({ incident, onDeleteIncidentClick, showScheduledIcon }) => {

  const lastUpdateDate = incident.latestUpdate.fmt_created_at;

  return (
    <tr>
      <td>
        <h4 className="ui image header">
          <div className="content">
            <Link to={`/admin/incidents/edit/${incident.id}`} style={{ color: 'inherit' }}>
              {incident.name}
            </Link>
            <div className="sub header">
              {statuses[incident.latestUpdate.status].displayName},{' '}
              {lastUpdateDate.fromNow()} at {lastUpdateDate.format('ddd, h:mm A (zz)')}
            </div>
          </div>
        </h4>
      </td>
      {
        incident.type === 'realtime' && (
          <td className="five wide">
            <StatusIconWithText status={incident.components_impact_status} />
          </td>
        )
      }
      {
        incident.type === 'scheduled' && showScheduledIcon && (
          <td className="five wide">
            <div><StatusIcon status={'maintenance'} />{'Maintenance'}</div>
          </td>
        )
      }
      <td className="center aligned three wide">
        <Link to={`/admin/incidents/edit/${incident.id}`} style={{ color: 'inherit' }}>
          <i className="edit icon large" title="Edit Incident"></i>
        </Link>
        <i
          className="remove circle icon large"
          title="Delete Incident"
          onClick={onDeleteIncidentClick(incident.id)}
          style={{ cursor: 'pointer' }}
        ></i>
      </td>
    </tr>
  );
};

IncidentRow.propTypes = {
  incident: PropTypes.object.isRequired,
  onDeleteIncidentClick: PropTypes.func.isRequired,
  showScheduledIcon: PropTypes.bool
};

IncidentRow.defaultProps = {
  showScheduledIcon: false
};

// table
const UnresolvedListing = ({ incidents, onDeleteIncidentClick }) => {

  const highestImpactStatus = getHighestImpactStatus(incidents);

  return (
    <table className="ui celled striped table large">
      <thead>
        <tr>
          <th colSpan="3" className={`${getColor(highestImpactStatus)} ui message`}>
            Unresolved ({incidents.length})
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

UnresolvedListing.propTypes = {
  incidents: PropTypes.arrayOf(PropTypes.object).isRequired,
  onDeleteIncidentClick: PropTypes.func.isRequired
};

export default UnresolvedListing;
export { IncidentRow };
