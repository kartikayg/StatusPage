/**
 * @fileoverview Listing of incidents (of all types)
 */
import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import _find from 'lodash/fp/find';
import { Modal } from 'semantic-ui-react';
import { NotificationManager } from 'react-notifications';

import RealtimeList from './realtime/list';
import ScheduledList from './scheduled/list';
import { apiGateway } from '../../../lib/ajax-actions';
import { filterRealtimeIncidents, filterScheduledIncidents } from '../../../redux/helper';

/**
 * Listing of Incidents
 */
class Listing extends React.Component {

  constructor(props) {

    super(props);

    this.state = {
      tab: props.match.params.tab || 'realtime',
      removeIncident: {
        showModal: false,
        id: null,
        name: null,
        ajax: false
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

    if (this.state.removeIncident.showModal === true) {
      return;
    }

    // make sure the id is valid
    const inc = _find(['id', id])(this.props.incidents);

    if (!inc) {
      return;
    }

    // show a confirm modal
    this.setState({
      removeIncident: {
        showModal: true,
        id,
        name: inc.name,
        ajax: false
      }
    });

  }

  // close delete confirm modal
  closeDeleteConfirmModal = (e) => {

    if (e) {
      e.preventDefault();
    }

    if (this.state.removeIncident.ajax === true) {
      return;
    }

    this.setState({
      removeIncident: {
        showModal: false,
        id: null,
        name: null,
        ajax: false
      }
    });
  }

  // delete incident after its confirmed
  confirmDeleteIncident = () => {

    if (this.state.removeIncident.ajax === true || !this.state.removeIncident.id) {
      return;
    }

    const { id } = this.state.removeIncident;

    // change the state and in the callback, make the ajax call.
    this.setState({
      removeIncident: {
        ...this.state.removeIncident,
        ajax: true
      }
    }, async () => {

      try {

        // make the ajax call to delete
        const resp = await apiGateway.remove(`/incidents/${id}`);

        this.setState({
          removeIncident: {
            ...this.state.removeIncident,
            ajax: false
          }
        }, () => {
          this.props.removeIncidentAction(id);
          this.closeDeleteConfirmModal();
          NotificationManager.success(resp.message);
        });

      }
      catch (err) {
        NotificationManager.error(err.message);
        this.setState({
          removeIncident: {
            ...this.state.removeIncident,
            ajax: false
          }
        });

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

    const modalDeleteBtnCls = classNames('negative ui button', {
      loading: this.state.removeIncident.ajax,
      disabled: this.state.removeIncident.ajax
    });

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

        <Modal
          size='tiny'
          open={this.state.removeIncident.showModal}
          onClose={this.closeDeleteConfirmModal}
          closeOnDocumentClick={true}
        >
          <Modal.Header>
            Deleting Incident
          </Modal.Header>
          <Modal.Content>
            <p>
              Are you sure you want to delete the incident:{' '}
              <strong>{this.state.removeIncident.name}</strong>
            </p>
          </Modal.Content>
          <Modal.Actions>
            <a href="#" onClick={this.closeDeleteConfirmModal}>Cancel</a>{' '}
            <button className={modalDeleteBtnCls} onClick={this.confirmDeleteIncident}>
              Delete
            </button>
          </Modal.Actions>
        </Modal>

      </div>
    );
  }

}

export default Listing;
