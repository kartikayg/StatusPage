/**
 * @fileoverview Container component: Incidents Admin Page
 */

import React from 'react';
import { connect } from 'react-redux';
import { Route, Switch, Redirect } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import PropTypes from 'prop-types';
import _sortBy from 'lodash/fp/sortBy';

import List from './incidents/list';
import NewIncident from './incidents/create';
import * as incActions from '../../redux/actions/incidents';
import { updateComponentStatus } from '../../redux/actions/components';

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
  incidents: PropTypes.object.isRequired,
  updateComponentStatusAction: PropTypes.func.isRequired,
  addIncidentAction: PropTypes.func.isRequired
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
