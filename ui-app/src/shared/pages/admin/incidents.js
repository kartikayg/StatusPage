/**
 * @fileoverview Container component: Incidents Admin Page
 */

import React from 'react';
import { connect } from 'react-redux';
import { Route, Switch } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import PropTypes from 'prop-types';
import { NotificationManager } from 'react-notifications';

import List from './incidents/list';
import * as rActions from '../../redux/actions/incidents';

/**
 * Container for displaying all section of components
 */
const IncidentsDisplay = (props) => {
  return (
    <div>
      <Helmet>
        <title>Incidents</title>
      </Helmet>
      <Switch>
        <Route key={`ROUTE_${Math.random()}`} exact path={props.match.path}
          render={(subProps) => {
            return <List {...subProps} />;
          }}
        />
      </Switch>
    </div>
  );
};

IncidentsDisplay.propTypes = {
  match: PropTypes.object.isRequired
};

// mapping redux state and actions to props to pass the display component
const mapStateToProps = (state) => {
  return {
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
  };
};


const IncidentsPage = connect(
  mapStateToProps,
  mapDispatchToProps
)(IncidentsDisplay);

export default IncidentsPage;
