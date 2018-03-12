/**
 * @fileoverview Listing of resolved incidents
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const CompletedListing = ({ incidents, onDeleteIncidentClick }) => {
  return (
    <table className="ui celled striped table large">
      <thead>
        <tr>
          <th colSpan="3">
            Completed/Cancelled
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
                    <Link to={`/admin/incidents/view/${i.id}`} style={{ color: 'inherit' }}>
                      {i.name}
                    </Link>
                    <div className="sub header">
                      {
                        i.scheduled_status === 'completed' &&
                        <div>
                          Completed on {i.fmt_resolved_at.format('dddd, MMMM Do YYYY')}
                        </div>
                      }
                      {
                        i.scheduled_status === 'cancelled' &&
                        <div>
                          <span style={{ color: 'red' }}>
                            Cancelled
                          </span> on {lastUpdateDate.format('dddd, MMMM Do YYYY')}
                        </div>
                      }
                    </div>
                  </div>
                </h4>
              </td>
              <td className="center aligned three wide">
                <Link to={`/admin/incidents/view/${i.id}`} style={{ color: 'inherit' }}>
                  <i className="unhide icon large" title="View Maintenance Details"></i>
                </Link>
                <i
                  className="remove circle icon large"
                  onClick={onDeleteIncidentClick(i.id)}
                  style={{ cursor: 'pointer' }}
                  title="Delete Incident"
                ></i>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

CompletedListing.propTypes = {
  incidents: PropTypes.arrayOf(PropTypes.object).isRequired,
  onDeleteIncidentClick: PropTypes.func.isRequired
};

export default CompletedListing;
