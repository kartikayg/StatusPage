/**
 * @fileoverview Listing of unresolved incidents
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { statuses } from '../../../../../presentation/incident-status';
import { StatusIconWithText, getColor } from '../../../../../presentation/component-status';
import { getHighestImpactStatus } from '../../../../../redux/helper';

const UnresolvedListing = ({ incidents, onDeleteIncidentClick }) => {

  const highestImpactStatus = getHighestImpactStatus(incidents);

  return (
    <table className="ui celled striped table large">
      <thead>
        <tr>
          <th colSpan="3" style={{ color: getColor(highestImpactStatus) }}>
            Unresolved ({incidents.length})
          </th>
        </tr>
      </thead>
      <tbody>
        {incidents.map(i => {

          const lastUpdateDate = i.latestUpdate.fmt_created_at;

          return (
            <tr key={i.id}>
              <td>
                <h4 className="ui image header">
                  <div className="content">
                    {i.name}
                    <div className="sub header">
                      {statuses[i.latestUpdate.status].displayName},{' '}
                      {lastUpdateDate.fromNow()} at {lastUpdateDate.format('ddd, h:mm A (zz)')}
                    </div>
                  </div>
                </h4>
              </td>
              <td className="five wide">
                <StatusIconWithText status={i.components_impact_status} />
              </td>
              <td className="center aligned three wide">
                <Link to='/admin/incidents' style={{ color: 'inherit' }}>
                  <i className="edit icon large"></i>
                </Link>
                <i
                  className="remove circle icon large"
                  onClick={onDeleteIncidentClick(i.id)}
                  style={{ cursor: 'pointer' }}
                ></i>
              </td>
            </tr>
          );
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
