/**
 * @fileoverview Listing of resolved incidents
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { StatusIconWithText } from '../../../../../presentation/component-status';

const ResolvedListing = ({ incidents, onDeleteIncidentClick }) => {

  return (
    <table className="ui celled striped table large">
      <thead>
        <tr>
          <th colSpan="3">
            Resolved/Past
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
                    <Link to={`/admin/incidents/view/${i.id}`} style={{ color: 'inherit' }}>
                      {i.name}
                    </Link>
                    <div className="sub header">
                      {
                        i.type === 'realtime' &&
                        <div>
                          Resolved on {i.fmt_resolved_at.format('dddd, MMMM Do YYYY')}
                        </div>
                      }
                      {
                        i.type === 'backfilled' &&
                        <div>
                          {i.fmt_resolved_at.format('dddd, MMMM Do YYYY')}
                        </div>
                      }
                    </div>
                  </div>
                </h4>
              </td>
              <td className="five wide">
                <StatusIconWithText status={i.components_impact_status} />
              </td>
              <td className="center aligned three wide">
                <Link to={`/admin/incidents/view/${i.id}`} style={{ color: 'inherit' }}>
                  <i className="unhide icon large" title="View Incident"></i>
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

ResolvedListing.propTypes = {
  incidents: PropTypes.arrayOf(PropTypes.object).isRequired,
  onDeleteIncidentClick: PropTypes.func.isRequired
};

export default ResolvedListing;
