/**
 * @fileoverview
 */

import React from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import _orderBy from 'lodash/fp/orderBy';

import { getColor } from '../presentation/component-status';
import flashMsgStorage from '../lib/flash-message-storage';
import { fmtIncidents } from '../redux/helpers/incidents';
import IncidentUpdates from './admin/incidents/incident-updates';

const ViewIncidentDisplay = (props) => {

  const { incidentId } = props.match.params;

  const incident = props.incidents.find(i => {
    return i.id === incidentId;
  });

  if (!incident) {
    flashMsgStorage.add('error', 'Incident not found.');
    return <Redirect to='/' />;
  }

  let impactStatus = incident.components_impact_status;
  if (incident.type === 'scheduled') {
    impactStatus = 'maintenance';
  }

  return (
    <div>
      <Helmet>
        <title>Incident</title>
      </Helmet>
      <div className="ui main text container" style={{ marginTop: '5rem', maxWidth: '700px !important' }}>

        <h1 className='ui header aligned center'>{process.env.COMPANY_NAME}</h1>

        <div>
          <h1 className={`ui ${getColor(impactStatus)} header`}>
            {incident.name}
          </h1>
          <div>
            {incident.components.map(c => {
              return (
                <div className="ui horizontal label large" key={c.id}>{c.name}</div>
              );
            })}
          </div>
          <div style={{ marginTop: '1rem' }}>
            <IncidentUpdates
              incident={incident}
              updates={_orderBy(['created_at'])(['desc'])(incident.updates)}
              allowNewUpdate={false}
              allowEdits={false}
            />
          </div>
        </div>

        <div className="ui divider"></div>

        <div style={{ marginTop: '-0.40rem', textAlign: 'center' }}>
          <a href='/' style={{ fontSize: '1rem' }}>
            View Status Page
          </a>
        </div>

      </div>
    </div>
  );

};

ViewIncidentDisplay.propTypes = {
  incidents: PropTypes.arrayOf(PropTypes.object).isRequired,
  match: PropTypes.object.isRequired
};

// mapping redux state and actions to props
const mapStateToProps = (state) => {
  return {
    incidents: fmtIncidents(state)
  };
};

const ViewIncidentPage = connect(mapStateToProps)(ViewIncidentDisplay);
export default ViewIncidentPage;
