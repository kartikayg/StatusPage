/**
 * @fileoverview
 */

import React from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import PropTypes from 'prop-types';

import flashMsgStorage from '../lib/flash-message-storage';

class ManageSubscriptionDisplay extends React.Component {

  render() {

    // find the subscription
    const { subscriptionId } = this.props.match.params;
    const subscriptionObj = this.props.subscriptions.find(sub => {
      return sub.id === subscriptionId;
    });

    if (!subscriptionObj) {
      flashMsgStorage.add('error', 'Subscription not found');
      return <Redirect to='/' />;
    }

    return (
      <div>
        <Helmet>
          <title>Manage Subscription</title>
        </Helmet>
      </div>
    );

  }
}

// mapping redux state and actions to props
const mapStateToProps = (state) => {
  return {
    subscriptions: state.subscriptions
  };
};

const mapDispatchToProps = (dispatch) => {
  return {

  };
};

const ManageSubscriptionPage = connect(
  mapStateToProps,
  mapDispatchToProps
)(ManageSubscriptionDisplay);

export default ManageSubscriptionPage;
