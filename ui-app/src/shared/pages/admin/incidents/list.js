/**
 * @fileoverview Listing of incidents (of all types)
 */
import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import _find from 'lodash/fp/find';

import RealtimeList from './realtime/list';
import ScheduledList from './scheduled/list';
import { filterRealtimeIncidents, filterScheduledIncidents } from '../../../redux/helpers/incidents';
import DeleteModal from './delete-modal';

/**
 * Listing of Incidents
 */
class Listing extends React.Component {

  constructor(props) {

    super(props);

    this.state = {
      tab: props.match.params.tab || 'realtime',
      removeIncident: {
        id: null,
        name: null
      }
    };
  }

  static propTypes = {
    match: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
    incidents: PropTypes.arrayOf(PropTypes.object).isRequired,
    removeIncidentAction: PropTypes.func.isRequired
  }

  onTabClick = (e) => {
    this.props.history.push(`/admin/incidents/${e.target.dataset.tab}`);
  }

  // on delete icon click, show the modal
  onDeleteIncidentClick = (id) => (e) => { // eslint-disable-line arrow-body-style

    e.preventDefault();

    // make sure the id is valid
    const inc = _find(['id', id])(this.props.incidents);

    if (!inc) {
      return;
    }

    // show a confirm modal
    this.setState({
      removeIncident: {
        id,
        name: inc.name
      }
    });

  }

  // close delete confirm modal
  closeDeleteConfirmModal = () => {
    this.setState({
      removeIncident: {
        id: null,
        name: null
      }
    });
  }

  render() {

    const noBorder = {
      borderLeft: '0px',
      borderRight: '0px',
      borderBottom: '0px',
      paddingLeft: '0px'
    };

    const realtimeTabClass = classNames('item', { active: this.state.tab === 'realtime' });
    const scheduledTabClass = classNames('item', { active: this.state.tab === 'scheduled' });

    /* eslint-disable brace-style */

    return (
      <div>
        <h1 className='ui header' style={{ marginBottom: '2.5rem' }}>Incidents</h1>
        <div className="ui top attached tabular menu">
          <a className={realtimeTabClass} data-tab='realtime' onClick={this.onTabClick}>
            Incidents
          </a>
          <a className={scheduledTabClass} data-tab='scheduled' onClick={this.onTabClick}>
            Scheduled Maintenance
          </a>
        </div>
        {this.state.tab === 'realtime' &&
          <div className="ui bottom attached tab segment active" style={ noBorder }>
            <RealtimeList
              incidents={filterRealtimeIncidents(this.props.incidents)}
              onDeleteIncidentClick={this.onDeleteIncidentClick}
            />
          </div>
        }
        {this.state.tab === 'scheduled' &&
          <div className="ui bottom attached tab segment active" style={ noBorder }>
            <ScheduledList
              incidents={filterScheduledIncidents(this.props.incidents)}
              onDeleteIncidentClick={this.onDeleteIncidentClick}
            />
          </div>
        }

        {/* delete modal */}
        {
          this.state.removeIncident.id !== null && <DeleteModal
            id={this.state.removeIncident.id}
            name={this.state.removeIncident.name}
            onModalClose={this.closeDeleteConfirmModal}
            removeIncidentAction={this.removeIncidentAction}
          />
        }

      </div>
    );

    /* eslint-enable brace-style */

  }

}

export default Listing;
