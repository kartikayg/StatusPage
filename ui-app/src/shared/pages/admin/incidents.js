/**
 * @fileoverview Container component: Incidents Admin Page
 */

import React from 'react';
import { connect } from 'react-redux';
import { Route, Switch, Redirect } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import PropTypes from 'prop-types';
import _sortBy from 'lodash/fp/sortBy';
import _filter from 'lodash/fp/filter';

import List from './incidents/list';
import NewIncident from './incidents/create';
import * as incActions from '../../redux/actions/incidents';
import { updateComponentStatus } from '../../redux/actions/components';
import { fmtIncidents } from '../../redux/helper';

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
        <Route key={`ROUTE_${Math.random()}`} path={`${props.match.path}/add/:type?`}
          render={(subProps) => {
            if (props.components.length === 0) {
              return <Redirect to="/admin/components" />;
            }
            return <NewIncident {...subProps}
                      components={props.components}
                      updateComponentStatusAction={props.updateComponentStatusAction}
                      addIncidentAction={props.addIncidentAction}
                   />;
          }}
        />
        <Route key={`ROUTE_${Math.random()}`} path={`${props.match.path}/edit/:id`}
          render={(subProps) => {
          }}
        />
        <Route key={`ROUTE_${Math.random()}`} path={`${props.match.path}/view/:id`}
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
  history: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,
  components: PropTypes.arrayOf(PropTypes.object).isRequired,
  incidents: PropTypes.arrayOf(PropTypes.object).isRequired,
  updateComponentStatusAction: PropTypes.func.isRequired,
  addIncidentAction: PropTypes.func.isRequired
};

// mapping redux state and actions to props
const mapStateToProps = (state) => {
  return {
    // only show active components, sort by sort order
    components: _sortBy(['sort_order', 'created_at'])(_filter('active')(state.components)),
    incidents: fmtIncidents(state)
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    addIncidentAction: (incident) => {
      dispatch(incActions.addIncident(incident));
    },
    updateComponentStatusAction: (payload) => {
      dispatch(updateComponentStatus(payload));
    }
  };
};


const IncidentsPage = connect(
  mapStateToProps,
  mapDispatchToProps
)(IncidentsDisplay);

export default IncidentsPage;
