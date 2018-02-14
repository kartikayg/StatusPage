/**
 * @fileoverview
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'semantic-ui-react';
import classNames from 'classnames';
import _find from 'lodash/fp/find';
import DatePicker from 'react-datepicker';
import moment from 'moment-timezone';
import { NotificationManager } from 'react-notifications';

import { statuses as incidentStatus } from '../../../presentation/incident-status';
import { Render as RenderMessage, Input as MessageInput } from './incident-message';
import { apiGateway } from '../../../lib/ajax-actions';

// incident-update row
class UpdateRow extends React.Component {

  static propTypes = {
    item: PropTypes.object.isRequired,
    onEditButtonClick: PropTypes.func.isRequired
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

    const editButtonStyles = {
      display: this.state.hovered ? '' : 'none'
    };

    return (
      <div
        className="item incident-update-row"
        style={{ paddingBottom: '2rem' }}
        onMouseOut={this.onMouseOut}
        onMouseOver={this.onMouseOver}
      >
        <div style={editButtonStyles} className="right floated content">
          <button
            className="ui button tiny"
            onClick={this.props.onEditButtonClick(update.id)}
          >
            Edit
          </button>
        </div>
        <div className="content">
          <h3 style={{ display: 'inline', fontSize: '1.1rem' }}>
            {incidentStatus[update.status].displayName}
          </h3>
          {' '}-{' '}
          <span className="sub" style={{ color: 'rgba(0,0,0,.6)' }}>
            {update.fmt_displayed_at.format('MMM D, YYYY - h:mm A (zz)')}
          </span>
          <div style={{ marginTop: '5px', fontSize: '1.05rem' }} >
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

  static propTypes = {
    incidentId: PropTypes.string.isRequired,
    updates: PropTypes.arrayOf(PropTypes.object).isRequired,
    updateIncidentAction: PropTypes.func.isRequired
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

  // close delete confirm modal
  closeEditModal = (e) => {

    if (e) {
      e.preventDefault();
    }

    if (this.state.editIncidentUpdate.ajax === true) {
      return;
    }

    this.setState(this.getInitialState());

  }

  updateInputValue = (name, value) => {
    this.setState(prevState => {
      return {
        editIncidentUpdate: {
          ...prevState.editIncidentUpdate,
          inputs: {
            ...prevState.editIncidentUpdate.inputs,
            [name]: value
          }
        }
      };
    });
  }

  updateEditModalAjaxState = (state, cb) => {
    this.setState(prevState => {
      return {
        editIncidentUpdate: {
          ...prevState.editIncidentUpdate,
          ajax: state
        }
      };
    }, cb);
  }

  onMessageChange = (value) => {
    this.updateInputValue('message', value);
  }

  onDateChange = (date) => {
    this.updateInputValue('displayed_at', date);
  }

  onSaveEditForm = () => {

    if (!this.state.editIncidentUpdate.id || this.state.editIncidentUpdate.ajax) {
      return;
    }

    this.updateEditModalAjaxState(true, async () => {

      try {

        const updData = {
          message: this.state.editIncidentUpdate.inputs.message.text,
          displayed_at: this.state.editIncidentUpdate.inputs.displayed_at.format()
        };

        const url = `/incidents/${this.props.incidentId}/incident_updates/${this.state.editIncidentUpdate.id}`;

        const savedIncident = await apiGateway.patch(url, { update: updData });

        this.updateEditModalAjaxState(false, () => {
          this.props.updateIncidentAction(savedIncident);
          NotificationManager.success('Incident successfully updated');
          this.setState(this.getInitialState());
        });
      }
      catch (err) {
        this.updateEditModalAjaxState(false);
        NotificationManager.error(err.message);
      }

    });

  }

  getInitialState = () => {
    return {
      editIncidentUpdate: {
        showModal: false,
        id: null,
        ajax: false,
        inputs: {
          message: { text: '', selection: null }
        }
      }
    };
  }

  render() {

    const modalSaveBtnCls = classNames('positive ui button', {
      loading: this.state.editIncidentUpdate.ajax,
      disabled: this.state.editIncidentUpdate.ajax
    });

    return (
      <div className="ui very relaxed list divided middle aligned">
        {this.props.updates.map(u => {
          return <UpdateRow
                    key={u.id}
                    item={u}
                    onEditButtonClick={this.onEditButtonClick}
                  />;
        })}
        <Modal
          size='tiny'
          open={this.state.editIncidentUpdate.showModal}
          onClose={this.closeEditModal}
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
                  onChange={this.onMessageChange}
                  name={'message'}
                />
              </div>
            </form>
          </Modal.Content>
          <Modal.Actions>
            <a href="#" onClick={this.closeEditModal}>Cancel</a>{' '}
            <button className={modalSaveBtnCls} onClick={this.onSaveEditForm}>
              Save
            </button>
          </Modal.Actions>
        </Modal>
      </div>
    );
  }

}

export default IncidentUpdates;
