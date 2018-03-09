/**
 * @fileoverview
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { Helmet } from 'react-helmet';
import _sortBy from 'lodash/fp/sortBy';
import _filter from 'lodash/fp/filter';

import SubscribeButton from './dashboard/subscribe-button';

import { fmtIncidents} from '../redux/helpers/incidents';

const DashboardDisplay = (props) => {
  return (
    <div>
      <Helmet>
        <title>Dashboard</title>
      </Helmet>
      <div className="ui main text container" style={{ marginTop: '5rem', maxWidth: '850px !important' }}>
        <div>
          <h1 className="ui header" style={{ float: 'left' }}>Test Company</h1>
          <SubscribeButton />
        </div>
      </div>
    </div>
  );
};

DashboardDisplay.propTypes = {
  components: PropTypes.arrayOf(PropTypes.object).isRequired,
  incidents: PropTypes.arrayOf(PropTypes.object).isRequired
};

// mapping redux state and actions to props
const mapStateToProps = (state) => {
  return {
    // only show active components, sort by sort order
    components: _sortBy(['sort_order', 'created_at'])(_filter('active')(state.components)),
    incidents: fmtIncidents(state)
  };
};

const DashboardPage = connect(
  mapStateToProps
)(DashboardDisplay);

export default DashboardPage;
