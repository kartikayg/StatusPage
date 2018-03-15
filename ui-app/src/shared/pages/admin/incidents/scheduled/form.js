/**
 * @fileoverview Form for a new/update scheduled incident
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { NotificationManager } from 'react-notifications';
import DatePicker from 'react-datepicker';
import moment from 'moment-timezone';
import _getOr from 'lodash/fp/getOr';
import _pick from 'lodash/fp/pick';
import _flow from 'lodash/fp/flow';

import { Input as MessageInput } from '../incident-message';
import { scheduledStatuses } from '../../../../redux/helpers/incidents';
import { apiGateway } from '../../../../lib/ajax-actions';
import { StatusDropDown } from '../../../../presentation/component-status';

const _pickBy = require('lodash/fp/pickBy').convert({ cap: false });
const _each = require('lodash/fp/each').convert({ cap: false });
const _map = require('lodash/fp/map').convert({ cap: false });

class Form extends React.Component {

  static propTypes = {
    components: PropTypes.arrayOf(PropTypes.object).isRequired,
    updateComponentStatusAction: PropTypes.func.isRequired,
    addIncidentAction: PropTypes.func,
    updateIncidentAction: PropTypes.func,
    history: PropTypes.object.isRequired,
    incident: PropTypes.object
  }

  constructor(props) {

    super(props);

    const cmpState = {};

    props.components.forEach(c => {
      cmpState[c.id] = {
        // if the id exists in the components array
        checked: _getOr([], 'components', props.incident)
          .findIndex(ic => ic.id === c.id) !== -1, // eslint-disable-line arrow-body-style
        originalStatus: c.status,
        status: c.status
      };
    });

    this.state = {
      inputs: {
        name: _getOr('', 'name', props.incident),
        type: 'scheduled',
        components: cmpState,
        status: _getOr('scheduled', 'latestUpdate.status', props.incident),
        message: { text: '', selection: null },
        do_notify_subscribers: true,
        scheduled_auto_status_updates: _getOr(false, 'scheduled_auto_status_updates', props.incident),
        scheduled_auto_updates_send_notifications: _getOr(false, 'scheduled_auto_updates_send_notifications', props.incident),
        originalStatus: _getOr('scheduled', 'latestUpdate.status', props.incident),
        scheduled_start_time: _getOr(null, 'fmt_scheduled_start_time', props.incident),
        scheduled_end_time: _getOr(null, 'fmt_scheduled_end_time', props.incident)
      },
      saving: false,
      action: props.incident ? 'Update' : 'New'
    };

  }

  // updates input value from modal
  updateInputValue = (name, value) => {
    this.setState(prevState => {
      return {
        inputs: {
          ...prevState.inputs,
          [name]: value
        }
      };
    });
  }

  /**
   * to update component state data
   * @param {string} id
   * @param {string} prop
   * @param {mixed} value
   */
  updateComponentStateData = (id, prop, value) => {
    this.setState(prevState => {
      return {
        inputs: {
          ...prevState.inputs,
          components: {
            ...prevState.inputs.components,
            [id]: {
              ...prevState.inputs.components[id],
              [prop]: value
            }
          }
        }
      };
    });
  }

  // on input change, update the state
  onInputChange = (e) => {

    const { target } = e;
    const { name } = target;
    const value = target.type === 'checkbox' ? target.checked : target.value;

    this.updateInputValue(name, value);

  }

  // on component checkbox
  onComponentCheckboxChange = (e) => {

    const { target } = e;
    const { name } = target;
    const value = target.checked;

    const parts = name.split('-');

    if (parts.length !== 3) {
      return;
    }

    const id = parts[1];

    this.updateComponentStateData(id, 'checked', value);

  }

  // on component status change
  onComponentStatusChange = (e, { name, value }) => {

    const parts = name.split('-');

    if (parts.length !== 3) {
      return;
    }

    const id = parts[1];

    this.updateComponentStateData(id, 'status', value);

  }

  // on submit button click
  onSaveClick = async (e) => {

    e.preventDefault();

    if (this.state.saving) {
      return;
    }

    /* eslint-disable function-paren-newline */

    this.setState({ saving: true }, async () => {

      try {

        const impactedComponents = [];
        const updatedComponentsCall = [];

        _each((o, id) => {
          if (o.checked === true) {
            impactedComponents.push({ id, status: o.status });
            // the status also changed, so lets update it
            if (o.status !== o.originalStatus) {
              const c = { id, status: o.status };
              updatedComponentsCall.push(
                apiGateway.patch(`/components/${c.id}`, { component: c })
              );
            }
          }
        })(this.state.inputs.components);

        // first, lets update the component status
        const cmpUpdRes = await Promise.all(updatedComponentsCall);

        // create incident data object
        const incData = _pick([
          'name',
          'status',
          'do_notify_subscribers',
          'type',
          'scheduled_auto_status_updates',
          'scheduled_auto_updates_send_notifications'
        ])(this.state.inputs);

        incData.message = this.state.inputs.message.text;
        incData.components = impactedComponents.map(c => {
          return c.id;
        });

        // for status, if its an update
        if (this.state.action === 'Update') {
          // if the status hasn't changed
          if (this.state.inputs.originalStatus === this.state.inputs.status) {
            // only a message, then its an update
            if (this.state.inputs.message) {
              incData.status = 'update';
            }
            else {
              incData.status = null;
            }
          }
        }

        if (this.state.inputs.scheduled_start_time) {
          incData.scheduled_start_time = this.state.inputs.scheduled_start_time.set('second', 0).format();
        }

        if (this.state.inputs.scheduled_end_time) {
          incData.scheduled_end_time = this.state.inputs.scheduled_end_time.set('second', 0).format();
        }

        let savedIncident;

        if (this.state.action === 'New') {
          savedIncident = await apiGateway.post('/incidents', { incident: incData });
        }
        else {
          const { id } = this.props.incident;
          savedIncident = await apiGateway.patch(`/incidents/${id}`, { incident: incData });
        }

        this.setState({ saving: false }, () => {

          // update redux
          cmpUpdRes.forEach(cmp => {
            this.props.updateComponentStatusAction({
              id: cmp.id, status: cmp.status
            });
          });

          if (this.state.action === 'New') {
            this.props.addIncidentAction(savedIncident);
            NotificationManager.success('Maintenance successfully created');
          }
          else {
            this.props.updateIncidentAction(savedIncident);
            NotificationManager.success('Maintenance successfully updated');
          }

          // go back to listing
          this.props.history.push('/admin/incidents/scheduled');

        });

      }
      catch (err) {
        this.setState({ saving: false });
        NotificationManager.error(err.message);
      }

    });

    /* eslint-enable function-paren-newline */

  }


  render() {

    const saveBtnClasses = classNames('ui button positive', {
      loading: this.state.saving,
      disabled: this.state.saving
    });

    const scheduledStatus = _getOr('scheduled', 'scheduled_status', this.props.incident);
    const allowedStatusesForUpdate = [];
    switch (scheduledStatus) {
      case 'scheduled':
        allowedStatusesForUpdate.push('scheduled', 'in_progress', 'cancelled');
        break;
      default:
        allowedStatusesForUpdate.push('in_progress', 'verifying', 'resolved', 'cancelled');
        break;
    }

    /* eslint-disable brace-style */

    return (
      <form className="ui form">
        <div className="field required">
          <label>Maintenance Name</label>
          <input
            type="text"
            name="name"
            onChange={this.onInputChange}
            value={this.state.inputs.name}
          />
        </div>

        {this.state.action === 'Update' &&
          <div className='field required'>
            <label>Status</label>
            <select
              className="ui search dropdown"
              name="status"
              onChange={this.onInputChange}
              value={this.state.inputs.status}
            >
              {(
                _flow(
                  // hide resolved if not update
                  _pickBy((v, k) => {
                    return allowedStatusesForUpdate.includes(k);
                  }),
                  _map((v, k) => {
                    return <option key={k} value={k}>{v.displayName}</option>;
                  })
                )(scheduledStatuses)
              )}
            </select>
          </div>
        }

        <div className="two fields">
          <div className="field required">
            <label>Start Date & Time ({moment().format('zz')})</label>
            <DatePicker
              selected={this.state.inputs.scheduled_start_time}
              onChange={(val) => { this.updateInputValue('scheduled_start_time', val); }}
              showTimeSelect
              timeFormat="h:mm A"
              timeIntervals={5}
              dateFormat="MMM DD, YYYY  h:mm A"
              disabled={scheduledStatus !== 'scheduled'}
              minDate={moment()}
            />
          </div>
          <div className="field required">
            <label>End Date & Time ({moment().format('zz')})</label>
            <DatePicker
              selected={this.state.inputs.scheduled_end_time}
              onChange={(val) => { this.updateInputValue('scheduled_end_time', val); }}
              showTimeSelect
              timeFormat="h:mm A"
              timeIntervals={5}
              dateFormat="MMM DD, YYYY  h:mm A"
              minDate={this.state.inputs.scheduled_start_time}
            />
          </div>
        </div>

        <div className={`field ${this.state.action === 'New' ? 'required' : ''}`}>
          <label>{this.state.action === 'New' ? 'Details' : 'New Update Message'}</label>
          <div style={{ border: '1px solid rgba(0, 0, 0, 0.125)', padding: '10px', borderRadius: '0.2rem' }}>
            <MessageInput
              value={this.state.inputs.message}
              onChange={(val) => { this.updateInputValue('message', val); }}
              name={'message'}
            />
          </div>
        </div>
        <div className="field required">
          <label>Impacted Components</label>
          <div>
            <table className="ui basic celled table" style={{ marginTop: '5px' }}>
              <tbody>
                {this.props.components.map(c => {
                  return (
                    <tr key={c.id}>
                      <td className="one wide center aligned">
                        <input
                          type="checkbox"
                          name={`component-${c.id}-state`}
                          checked={this.state.inputs.components[c.id].checked}
                          onChange={this.onComponentCheckboxChange}
                          className=" ui large form"
                        />
                      </td>
                      <td>{c.name}</td>
                      {this.state.action === 'Update' &&
                        <td className="right aligned five wide">
                          <StatusDropDown
                            value={this.state.inputs.components[c.id].status}
                            readOnly={!this.state.inputs.components[c.id].checked}
                            onChange={this.onComponentStatusChange}
                            name={`component-${c.id}-status`}
                          />
                        </td>
                      }
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {this.state.action === 'Update' &&
            <p style={{ fontStyle: 'italic', marginTop: '0.2rem' }}>
              If auto-update is not enabled, you need to change the component status manually
            </p>
          }
        </div>
        <div className="field">
          <div className="ui checkbox">
            <input
              type="checkbox"
              name="do_notify_subscribers"
              checked={this.state.inputs.do_notify_subscribers}
              onChange={this.onInputChange}
            />
            <label>Notify Subscribers</label>
          </div>
        </div>

        <h4>---- Automated Updates ----</h4>

        <div className="field">
          <div className="ui checkbox">
            <input
              type="checkbox"
              name="scheduled_auto_status_updates"
              checked={this.state.inputs.scheduled_auto_status_updates}
              onChange={this.onInputChange}
            />
            <label>Update statuses for this maintenance and components on start and end time</label>
          </div>
        </div>

        {this.state.inputs.scheduled_auto_status_updates &&
          <div className="field">
            <div className="ui checkbox" style={{ marginLeft: '3rem' }}>
              <input
                type="checkbox"
                name="scheduled_auto_updates_send_notifications"
                checked={this.state.inputs.scheduled_auto_updates_send_notifications}
                onChange={this.onInputChange}
              />
              <label>Notify Subscribers when auto updates</label>
            </div>
          </div>
        }

        <div style={{ marginTop: '1.5rem' }}>
          <button
            className={saveBtnClasses}
            type="submit"
            onClick={this.onSaveClick}
          >
            Submit
          </button>{' '}
          <a href="#" onClick={() => { this.props.history.goBack(); }}>Cancel</a>
        </div>
      </form>
    );
  }

  /* eslint-enable brace-style */

}

export default Form;
