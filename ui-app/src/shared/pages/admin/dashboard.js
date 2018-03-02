/**
 * @fileoverview Admin dashboard page
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import _sortBy from 'lodash/fp/sortBy';
import _filter from 'lodash/fp/filter';

import IncidentsListing from './dashboard/incidents';
import ComponentsListing from './dashboard/components';
import { removeIncident } from '../../redux/actions/incidents';
import { updateComponentStatus } from '../../redux/actions/components';

import { fmtIncidents, filterUnresolvedIncidents } from '../../redux/helpers/incidents';

const DashboardDisplay = (props) => {
  return (
    <div>
      <Helmet>
        <title>Dashboard</title>
      </Helmet>
      <h2>Dashboard page</h2>
      <div style={{ marginTop: '2rem' }}>
        <IncidentsListing
          incidents={props.incidents}
          removeIncidentAction={props.removeIncidentAction}
        />
      </div>
      <div style={{ marginTop: '3rem' }}>
        <ComponentsListing
          components={props.components}
          updateComponentStatusAction={props.updateComponentStatusAction}
        />
      </div>
    </div>
  );
};

DashboardDisplay.propTypes = {
  components: PropTypes.arrayOf(PropTypes.object).isRequired,
  incidents: PropTypes.arrayOf(PropTypes.object).isRequired,
  removeIncidentAction: PropTypes.func.isRequired,
  updateComponentStatusAction: PropTypes.func.isRequired
};

// mapping redux state and actions to props
const mapStateToProps = (state) => {
  return {
    // only show active components, sort by sort order
    components: _sortBy(['sort_order', 'created_at'])(_filter('active')(state.components)),
    incidents: filterUnresolvedIncidents(fmtIncidents(state))
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    removeIncidentAction: (id) => {
      dispatch(removeIncident(id));
    },
    updateComponentStatusAction: (payload) => {
      dispatch(updateComponentStatus(payload));
    }
  };
};

const DashboardPage = connect(
  mapStateToProps,
  mapDispatchToProps
)(DashboardDisplay);

export default DashboardPage;
