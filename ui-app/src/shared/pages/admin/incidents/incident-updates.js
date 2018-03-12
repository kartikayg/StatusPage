/**
 * @fileoverview Render incident updates with add and edit functionality
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'semantic-ui-react';
import classNames from 'classnames';
import _find from 'lodash/fp/find';
import DatePicker from 'react-datepicker';
import moment from 'moment-timezone';
import { NotificationManager } from 'react-notifications';

import { statuses as incidentStatus } from '../../../redux/helpers/incidents';
import { Render as RenderMessage, Input as MessageInput } from './incident-message';
import { apiGateway } from '../../../lib/ajax-actions';

// incident-update row
class UpdateRow extends React.Component {

  static propTypes = {
    incident: PropTypes.object.isRequired,
    item: PropTypes.object.isRequired,
    onEditButtonClick: PropTypes.func.isRequired,
    allowEdit: PropTypes.bool.isRequired
  }

  state = {
    hovered: false
  }

  onMouseOut = () => {
    this.setState({ hovered: false });
  }

  onMouseOver = () => {
    this.setState({ hovered: true });
  }

  render() {

    const update = this.props.item;
    const { incident } = this.props;

    const editButtonStyles = {
      display: this.state.hovered ? '' : 'none'
    };

    const scheduledEventSameDate = (incident.type === 'scheduled' && incident.fmt_scheduled_start_time.get('date') === incident.fmt_scheduled_end_time.get('date'));

    return (
      <div
        className="item incident-update-row"
        style={{ paddingBottom: '0.5rem' }}
        onMouseOut={this.onMouseOut}
        onMouseOver={this.onMouseOver}
      >
        <div className="content">
          <div style={{ display: 'block', height: '20px' }}>
            <h3 style={{ display: 'inline', fontSize: '1.1rem' }}>
              {incidentStatus[update.status].displayName}
            </h3>
            {
              update.status !== 'scheduled' && (
                <span className="sub" style={{ color: 'rgba(0,0,0,.6)' }}>
                  {' '}-{' '}{update.fmt_displayed_at.format('MMM D, YYYY - h:mm A (zz)')}
                </span>
              )
            }
            {
              incident.type === 'scheduled' && incident.scheduled_status === 'scheduled' && (
                <span className="sub" style={{ color: 'rgba(0,0,0,.6)' }}>
                  {' - '}
                  {
                    scheduledEventSameDate && (
                      <span>
                        {incident.fmt_scheduled_start_time.format('MMM D YYYY, h:mm A')}
                        {' - '}
                        {incident.fmt_scheduled_end_time.format('h:mm A (zz)')}
                      </span>
                    )
                  }
                  {
                    scheduledEventSameDate === false && (
                      <span>
                        {incident.fmt_scheduled_start_time.format('MMM D, h:mm A')}
                        {'  -  '}
                        {incident.fmt_scheduled_end_time.format('MMM D, h:mm A (zz)')}
                      </span>
                    )
                  }
                </span>
              )
            }
            &nbsp;&nbsp;&nbsp;
            {
              this.props.allowEdit && (
                <a style={editButtonStyles} className="ui label small" onClick={this.props.onEditButtonClick(update.id)}>
                  <i className="edit icon"></i>
                  Edit
                </a>
              )
            }
          </div>
          <div style={{ marginTop: '0.25rem', fontSize: '1.05rem' }} >
            <RenderMessage message={update.message} />
          </div>
        </div>
      </div>
    );
  }
}

// container for all the updates
class IncidentUpdates extends React.Component {

  constructor(props) {
    super(props);
    this.state = this.getInitialState();
  }

  static defaultProps = {
    allowNewUpdate: false,
    allowEdits: true
  }

  static propTypes = {
    incident: PropTypes.object.isRequired,
    updates: PropTypes.arrayOf(PropTypes.object).isRequired,
    updateIncidentAction: PropTypes.func,
    allowEdits: PropTypes.bool.isRequired,
    allowNewUpdate: PropTypes.bool.isRequired
  }

  // initial state for this component
  getInitialState = () => {
    return {
      editIncidentUpdate: {
        showModal: false,
        id: null,
        ajax: false,
        inputs: {
          message: { text: '', selection: null },
          displayed_at: null
        }
      },
      addIncidentUpdate: {
        showModal: false,
        ajax: false,
        inputs: {
          message: { text: '', selection: null },
          do_notify_subscribers: true
        }
      }
    };
  }

  getModalKeyByType = (type) => {
    return type === 'add' ? 'addIncidentUpdate' : 'editIncidentUpdate';
  }

  // add incident update button clicked
  onAddButtonClick = (e) => {

    e.preventDefault();

    if (this.state.addIncidentUpdate.showModal === true) {
      return;
    }

    this.setState(prevState => {
      return {
        addIncidentUpdate: {
          ...prevState.addIncidentUpdate,
          showModal: true
        }
      };
    });

  }


  // on edit click, show the modal
  onEditButtonClick = (id) => (e) => { // eslint-disable-line arrow-body-style

    e.preventDefault();

    if (this.state.editIncidentUpdate.showModal === true) {
      return;
    }

    // make sure the id is valid
    const update = _find(['id', id])(this.props.updates);

    if (!update) {
      return;
    }

    // show a confirm modal
    this.setState({
      editIncidentUpdate: {
        showModal: true,
        id,
        ajax: false,
        inputs: {
          message: { text: update.message, selection: null },
          displayed_at: update.fmt_displayed_at
        }
      }
    });

  }

  // close modal
  onCloseModal = (e, type) => {

    if (e) {
      e.preventDefault();
    }

    const key = this.getModalKeyByType(type);

    if (this.state[key].ajax === true) {
      return;
    }

    this.setState({
      [key]: this.getInitialState()[key]
    });

  }

  // updates input value from modal
  updateInputValue = (type, name, value) => {

    const key = this.getModalKeyByType(type);

    this.setState(prevState => {
      return {
        [key]: {
          ...prevState[key],
          inputs: {
            ...prevState[key].inputs,
            [name]: value
          }
        }
      };
    });
  }

  updateModalAjaxState = (type, state, cb) => {

    const key = this.getModalKeyByType(type);

    this.setState(prevState => {
      return {
        [key]: {
          ...prevState[key],
          ajax: state
        }
      };
    }, cb);

  }

  onMessageChange = (type, value) => {
    this.updateInputValue(type, 'message', value);
  }

  onDateChange = (date) => {
    this.updateInputValue('edit', 'displayed_at', date);
  }

  onNotifySubscriberChange = (e) => {
    const { checked } = e.target;
    this.updateInputValue('add', 'do_notify_subscribers', checked);
  }

  // save button on edit form clicked
  onSaveEditForm = () => {

    if (!this.state.editIncidentUpdate.id || this.state.editIncidentUpdate.ajax) {
      return;
    }

    this.updateModalAjaxState('edit', true, async () => {

      try {

        const updData = {
          message: this.state.editIncidentUpdate.inputs.message.text,
          displayed_at: this.state.editIncidentUpdate.inputs.displayed_at.format()
        };

        const url = `/incidents/${this.props.incident.id}/incident_updates/${this.state.editIncidentUpdate.id}`;

        const savedIncident = await apiGateway.patch(url, { update: updData });

        this.updateModalAjaxState('edit', false, () => {
          this.props.updateIncidentAction(savedIncident);
          NotificationManager.success('Incident successfully updated');
          const key = this.getModalKeyByType('edit');
          this.setState({
            [key]: this.getInitialState()[key]
          });
        });
      }
      catch (err) {
        this.updateModalAjaxState('edit', false);
        NotificationManager.error(err.message);
      }

    });

  }

  // save button on add form clicked
  onSaveAddForm = () => {

    if (this.state.addIncidentUpdate.ajax) {
      return;
    }

    this.updateModalAjaxState('add', true, async () => {

      try {

        const updData = {
          message: this.state.addIncidentUpdate.inputs.message.text,
          do_notify_subscribers: this.state.addIncidentUpdate.inputs.do_notify_subscribers
        };

        const url = `/incidents/${this.props.incident.id}`;
        const savedIncident = await apiGateway.patch(url, { incident: updData });

        this.updateModalAjaxState('add', false, () => {
          this.props.updateIncidentAction(savedIncident);
          NotificationManager.success('Incident successfully updated');
          const key = this.getModalKeyByType('add');
          this.setState({
            [key]: this.getInitialState()[key]
          });
        });
      }
      catch (err) {
        this.updateModalAjaxState('add', false);
        NotificationManager.error(err.message);
      }

    });

  }

  render() {

    const editModalSaveBtnCls = classNames('positive ui button', {
      loading: this.state.editIncidentUpdate.ajax,
      disabled: this.state.editIncidentUpdate.ajax
    });

    const addModalSaveBtnCls = classNames('positive ui button', {
      loading: this.state.addIncidentUpdate.ajax,
      disabled: this.state.addIncidentUpdate.ajax
    });

    /* eslint-disable brace-style */

    return (
      <div>
        {this.props.allowNewUpdate &&
          <div style={{ marginBottom: '1.5rem' }}>
            <button className='ui button tiny positive' onClick={this.onAddButtonClick}>
              <i className="add icon"></i>
              Update
            </button>
          </div>
        }
        <div className="ui very relaxed list middle aligned">
          {this.props.updates.map(u => {
            return <UpdateRow
                      key={u.id}
                      incident={this.props.incident}
                      item={u}
                      onEditButtonClick={this.onEditButtonClick}
                      allowEdit={this.props.allowEdits}
                    />;
          })}

          {/* Edit incident-update modal */}
          {this.props.allowEdits &&
            <Modal
              size='tiny'
              open={this.state.editIncidentUpdate.showModal}
              onClose={(e) => { this.onCloseModal(e, 'edit'); }}
              closeOnDocumentClick={true}
              className='app-incident-update-edit-modal'
            >
              <Modal.Header>
                Editing Incident-Update
              </Modal.Header>
              <Modal.Content>
                <form className="ui form">
                  <div className='field required'>
                    <label>Date & Time ({moment().format('zz')})</label>
                    <DatePicker
                      selected={this.state.editIncidentUpdate.inputs.displayed_at}
                      onChange={this.onDateChange}
                      showTimeSelect
                      timeFormat="h:mm A"
                      timeIntervals={5}
                      dateFormat="MMM DD, YYYY  h:mm A"
                    />
                  </div>
                  <div className="field required">
                    <label>Message</label>
                    <MessageInput
                      value={this.state.editIncidentUpdate.inputs.message}
                      onChange={(val) => { this.onMessageChange('edit', val); }}
                      name={'message'}
                    />
                  </div>
                </form>
              </Modal.Content>
              <Modal.Actions>
                <a href="#" onClick={(e) => { this.onCloseModal(e, 'edit'); }}>
                  Cancel
                </a>
                {' '}
                <button className={editModalSaveBtnCls} onClick={this.onSaveEditForm}>
                  Save
                </button>
              </Modal.Actions>
            </Modal>
          }

          {/* add new update modal */}
          {this.props.allowNewUpdate &&
            <Modal
              size='tiny'
              open={this.state.addIncidentUpdate.showModal}
              onClose={(e) => { this.onCloseModal(e, 'add'); }}
              closeOnDocumentClick={true}
              className='app-incident-update-add-modal'
            >
              <Modal.Header>
                Add Incident-Update
              </Modal.Header>
              <Modal.Content>
                <form className="ui form">
                  <div className="field required">
                    <label>Message</label>
                    <MessageInput
                      value={this.state.addIncidentUpdate.inputs.message}
                      onChange={(val) => { this.onMessageChange('add', val); }}
                      name={'message'}
                    />
                  </div>
                  <div className="ui checkbox">
                    <input
                      type="checkbox"
                      name="do_notify_subscribers"
                      checked={this.state.addIncidentUpdate.inputs.do_notify_subscribers}
                      onChange={this.onNotifySubscriberChange}
                    />
                    <label>Notify Subscribers</label>
                  </div>
                </form>
              </Modal.Content>
              <Modal.Actions>
                <a href="#" onClick={(e) => { this.onCloseModal(e, 'add'); }}>
                  Cancel
                </a>
                {' '}
                <button className={addModalSaveBtnCls} onClick={this.onSaveAddForm}>
                  Save
                </button>
              </Modal.Actions>
            </Modal>
          }
        </div>
      </div>
    );

    /* eslint-enable brace-style */

  }
}

export default IncidentUpdates;
