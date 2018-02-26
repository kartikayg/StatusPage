/**
 * @fileoverview Listing of Upcoming scheduled incidents
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const UpcomingListing = ({ incidents, onDeleteIncidentClick }) => {
  return (
    <table className="ui celled striped table large">
      <thead>
        <tr>
          <th colSpan="3">
            Upcoming ({incidents.length})
          </th>
        </tr>
      </thead>
      <tbody>
        {incidents.map(i => {
          return (
            <tr key={i.id}>
              <td>
                <h4 className="ui image header">
                  <div className="content">
                    <Link to={`/admin/incidents/edit/${i.id}`} style={{ color: 'inherit' }}>
                      {i.name}
                    </Link>
                    <div className="sub header">
                      Scheduled for{' '}{i.fmt_scheduled_start_time.format('ddd, MMM Do YYYY, h:mm A (zz)')}
                    </div>
                  </div>
                </h4>
              </td>
              <td className="center aligned three wide">
                <Link to={`/admin/incidents/edit/${i.id}`} style={{ color: 'inherit' }}>
                  <i className="edit icon large" title="Edit Maintenance"></i>
                </Link>
                <i
                  className="remove circle icon large"
                  title="Delete Maintenance"
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

UpcomingListing.propTypes = {
  incidents: PropTypes.arrayOf(PropTypes.object).isRequired,
  onDeleteIncidentClick: PropTypes.func.isRequired
};

export default UpcomingListing;
