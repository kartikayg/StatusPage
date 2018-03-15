/**
 * @fileoverview List of webhook subscriptions
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import moment from 'moment-timezone';

const Listing = ({ subscriptions, onDeleteSubscriptionClick }) => {

  let body;

  // if no components found
  if (subscriptions.length === 0) {
    body = (
      <div>
        <p><strong>No webhook subscriptions found.</strong></p>
      </div>
    );
  }
  else {
    body = (
      <div>
        <table className="ui celled striped table medium">
          <thead>
            <tr>
              <th>Endpoint</th>
              <th>Date Added</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map(sub => {
              return (
                <tr key={sub.id}>
                  <td>{sub.uri}</td>
                  <td>{moment(sub.created_at).format('MMM D, YYYY')}</td>
                  <td>
                    <i
                      className="remove circle icon large"
                      onClick={onDeleteSubscriptionClick(sub.id)}
                      style={{ cursor: 'pointer' }}
                      title="Delete Subscription"
                    ></i>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <Helmet>
        <title>Webhook Subscriptions</title>
      </Helmet>
      {body}
    </div>
  );

};

Listing.propTypes = {
  subscriptions: PropTypes.arrayOf(PropTypes.object).isRequired,
  onDeleteSubscriptionClick: PropTypes.func.isRequired
};

export default Listing;
