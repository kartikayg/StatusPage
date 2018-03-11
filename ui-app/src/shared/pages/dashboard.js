/**
 * @fileoverview Dashboard page
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { Helmet } from 'react-helmet';
import _filter from 'lodash/fp/filter';

import SubscribeButton from './dashboard/subscribe-button';
import CurrentStatus from './dashboard/current-status';
import ComponentsBlock from './dashboard/components';
import PastIncidents from './dashboard/past-incidents';

import { fmtIncidents, filterUnresolvedIncidents } from '../redux/helpers/incidents';
import { getComponentsByGroup } from '../redux/helpers/components';

const DashboardDisplay = ({ components, componentsByGroup, incidents }) => {
  return (
    <div id="public-dashboard">
      <Helmet>
        <title>Dashboard</title>
      </Helmet>
      <div className="ui borderless main menu" style={{ marginTop: '1rem' }}>
        <div className="ui text container">
          <h1 className="ui header item left floated" style={{ paddingLeft: 0 }}>
            {process.env.COMPANY_NAME}
          </h1>
          <div className="ui right floated item" style={{ fontSize: '1rem' }}>
            <SubscribeButton />
          </div>
        </div>
      </div>
      <div className="ui text container">
        <CurrentStatus components={components} incidents={filterUnresolvedIncidents(incidents)} />
      </div>
      <div className="ui text container segment">
        <ComponentsBlock componentsByGroup={componentsByGroup} />
      </div>
      <div className="ui text container" style={{ marginTop: '5rem' }}>
        <PastIncidents incidents={incidents} />
      </div>
    </div>
  );
};

DashboardDisplay.propTypes = {
  components: PropTypes.arrayOf(PropTypes.object).isRequired,
  componentsByGroup: PropTypes.arrayOf(PropTypes.object).isRequired,
  incidents: PropTypes.arrayOf(PropTypes.object).isRequired
};

// mapping redux state and actions to props
const mapStateToProps = (state) => {
  return {
    components: _filter('active')(state.components),
    componentsByGroup: getComponentsByGroup(state, true),
    incidents: fmtIncidents(state)
  };
};

const DashboardPage = connect(mapStateToProps)(DashboardDisplay);
export default DashboardPage;
