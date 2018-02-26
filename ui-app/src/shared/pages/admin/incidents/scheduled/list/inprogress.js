/**
 * @fileoverview Listing of Inprogress maintenance
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { statuses } from '../../../../../redux/helpers/incidents';
import { getColor } from '../../../../../presentation/component-status';

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

          const lastUpdateDate = i.latestUpdate.fmt_created_at;

          return (
            <tr key={i.id}>
              <td>
                <h4 className="ui image header">
                  <div className="content">
                    <Link to={`/admin/incidents/edit/${i.id}`} style={{ color: 'inherit' }}>
                      {i.name}
                    </Link>
                    <div className="sub header">
                      {statuses[i.latestUpdate.status].displayName},{' '}
                      {lastUpdateDate.fromNow()} at {lastUpdateDate.format('ddd, h:mm A (zz)')}
                    </div>
                  </div>
                </h4>
              </td>
              <td className="center aligned three wide">
                <Link to={`/admin/incidents/edit/${i.id}`} style={{ color: 'inherit' }}>
                  <i className="edit icon large" title="Edit Incident"></i>
                </Link>
                <i
                  className="remove circle icon large"
                  title="Delete Incident"
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

InprogressListing.propTypes = {
  incidents: PropTypes.arrayOf(PropTypes.object).isRequired,
  onDeleteIncidentClick: PropTypes.func.isRequired
};

export default InprogressListing;
