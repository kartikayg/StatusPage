/**
 * @fileoverview Home page for public.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { Helmet } from 'react-helmet';
import _filter from 'lodash/fp/filter';

import SubscribeButton from './homepage/subscribe-button';
import CurrentStatus from './homepage/current-status';
import ComponentsBlock from './homepage/components';
import UpcomingMaintenances from './homepage/upcoming-maintenances';
import PastIncidents from './homepage/past-incidents';

import {
  fmtIncidents,
  filterUnresolvedIncidents,
  filterUpcomingScheduledIncidents
} from '../redux/helpers/incidents';
import { getComponentsByGroup } from '../redux/helpers/components';

const HomePageDisplay = ({ components, componentsByGroup, incidents }) => {

  const upcomingMaintenances = filterUpcomingScheduledIncidents(incidents);

  return (
    <div id="public-dashboard">

      <Helmet>
        <title>{`${process.env.COMPANY_NAME} - Status Page`}</title>
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

      {
        upcomingMaintenances.length > 0 && (
          <div className="ui text container" style={{ marginTop: '5rem' }}>
            <UpcomingMaintenances incidents={upcomingMaintenances} />
          </div>
        )
      }

      <div className="ui text container" style={{ margin: '5rem 0' }}>
        <PastIncidents incidents={incidents} />
      </div>

    </div>
  );
};

HomePageDisplay.propTypes = {
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

const HomePage = connect(mapStateToProps)(HomePageDisplay);
export default HomePage;
