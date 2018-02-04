/**
 * @fileoverview Container component: Incidents Admin Page
 */

import React from 'react';
import { connect } from 'react-redux';
import { Route, Switch } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import PropTypes from 'prop-types';
import { NotificationManager } from 'react-notifications';
import _sortBy from 'lodash/fp/sortBy';

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
        <Route key={`ROUTE_${Math.random()}`} exact path={`${props.match.path}/add`}
          render={(subProps) => {
          }}
        />
        <Route key={`ROUTE_${Math.random()}`} exact path={`${props.match.path}/add_maintenance`}
          render={(subProps) => {
          }}
        />
        <Route key={`ROUTE_${Math.random()}`} path={`${props.match.path}/:tab?`}
          render={(subProps) => {
            return <List {...subProps} incidents={props.incidents} />;
          }}
        />
      </Switch>
    </div>
  );
};

IncidentsDisplay.propTypes = {
  match: PropTypes.object.isRequired,
  components: PropTypes.arrayOf(PropTypes.object).isRequired,
  incidents: PropTypes.object.isRequired
};

// mapping redux state and actions to props
const mapStateToProps = (state) => {
  return {
    components: _sortBy(['sort_order', 'created_at'])(state.components),
    incidents: { realtime: [], scheduled: [] }
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
