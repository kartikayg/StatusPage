/**
 * @fileoverview Container component: Subscriptions Admin Page
 */

import React from 'react';
import { connect } from 'react-redux';
import { Route } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import PropTypes from 'prop-types';

import List from './subscriptions/list';
import * as subActions from '../../redux/actions/subscriptions';

/**
 * Container for displaying all section of components
 */
const SubscriptionsDisplay = (props) => {
  return (
    <div>
      <Helmet>
        <title>Subscriptions</title>
      </Helmet>

      {/* Listing Subscriptions */}
      <Route key={`ROUTE_${Math.random()}`} exact path={`${props.match.path}/:tab?`}
        render={(subProps) => {
          return <List {...subProps}
            subscriptions={props.subscriptions}
            removeSubscriptionAction={props.removeSubscriptionAction}
          />;
        }}
      />

    </div>
  );
};

SubscriptionsDisplay.propTypes = {
  history: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,
  subscriptions: PropTypes.arrayOf(PropTypes.object).isRequired,
  removeSubscriptionAction: PropTypes.func.isRequired
};


// mapping redux state and actions to props
const mapStateToProps = (state) => {
  return {
    subscriptions: state.subscriptions
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    removeSubscriptionAction: (id) => {
      dispatch(subActions.removeSubscription(id));
    }
  };
};

const SubscriptionsPage = connect(
  mapStateToProps,
  mapDispatchToProps
)(SubscriptionsDisplay);

export default SubscriptionsPage;
