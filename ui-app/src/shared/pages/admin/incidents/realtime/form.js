/**
 * @fileoverview Form for a new/update realtime incident
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import _pick from 'lodash/fp/pick';
import _flow from 'lodash/fp/flow';
import _getOr from 'lodash/fp/getOr';
import { NotificationManager } from 'react-notifications';

import { Input as MessageInput } from '../incident-message';
import { statuses as incidentStatuses } from '../../../../presentation/incident-status';
import { apiGateway } from '../../../../lib/ajax-actions';
import { StatusDropDown } from '../../../../presentation/component-status';

const _each = require('lodash/fp/each').convert({ cap: false });
const _map = require('lodash/fp/map').convert({ cap: false });
const _pickBy = require('lodash/fp/pickBy').convert({ cap: false });

const componentStatusesOrder = [
  'operational', 'maintenance', 'degraded_performance', 'partial_outage', 'major_outage'
];

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
        status: c.status,
        originalStatus: c.status
      };
    });

    this.state = {
      inputs: {
        name: _getOr('', 'name', props.incident),
        type: 'realtime',
        components: cmpState,
        status: _getOr('investigating', 'latestUpdate.status', props.incident),
        message: { text: '', selection: null },
        do_notify_subscribers: true,
        originalStatus: _getOr('investigating', 'latestUpdate.status', props.incident)
      },
      saving: false,
      action: props.incident ? 'Update' : 'New'
    };

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

    this.setState(prevState => {
      return {
        inputs: {
          ...prevState.inputs,
          [name]: value
        }
      };
    });

  }

  onMessageChange = (value) => {
    this.setState(prevState => {
      return {
        inputs: {
          ...prevState.inputs,
          message: value
        }
      };
    });
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
          'type']
        )(this.state.inputs);

        // get the message
        incData.message = this.state.inputs.message.text;

        // for status, if its an update
        if (this.state.action === 'Update' &&
            this.state.inputs.originalStatus === this.state.inputs.status &&
            !this.state.inputs.message
        ) {
          incData.status = '';
        }

        incData.components = impactedComponents.map(c => {
          return c.id;
        });

        // calculate the highest impacted component status
        if (impactedComponents.length > 0) {
          incData.components_impact_status = impactedComponents.reduce((hStatus, { status }) => {
            // find position of the statuses and return the highest
            const hPos = componentStatusesOrder.indexOf(hStatus);
            const cPos = componentStatusesOrder.indexOf(status);
            return hPos > cPos ? hStatus : status;
          }, impactedComponents[0].status);
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
          cmpUpdRes.forEach(({ component }) => {
            this.props.updateComponentStatusAction({
              id: component.id, status: component.status
            });
          });

          if (this.state.action === 'New') {
            this.props.addIncidentAction(savedIncident);
            NotificationManager.success('Incident successfully created');
          }
          else {
            this.props.updateIncidentAction(savedIncident);
            NotificationManager.success('Incident successfully updated');
          }

          // go back to listing
          this.props.history.push('/admin/incidents');

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

    return (
      <form className="ui form">
        <div className="field required">
          <label>Incident Name</label>
          <input
            type="text"
            name="name"
            onChange={this.onInputChange}
            value={this.state.inputs.name}
            readOnly={this.state.action === 'Update'}
          />
        </div>
        <div className={`field ${this.state.action === 'New' ? 'required' : ''}`}>
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
                  return k !== 'update' && (this.state.action === 'Update' || k !== 'resolved');
                }),
                _map((v, k) => {
                  return <option key={k} value={k}>{v.displayName}</option>;
                })
              )(incidentStatuses)
            )}
          </select>
        </div>
        <div className={`field ${this.state.action === 'New' ? 'required' : ''}`}>
          <label>Message</label>
          <div style={{ border: '1px solid rgba(0, 0, 0, 0.125)', padding: '10px', borderRadius: '0.2rem' }}>
            <MessageInput
              value={this.state.inputs.message}
              onChange={this.onMessageChange}
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
                      <td className="right aligned five wide">
                        <StatusDropDown
                          value={this.state.inputs.components[c.id].status}
                          readOnly={!this.state.inputs.components[c.id].checked}
                          onChange={this.onComponentStatusChange}
                          name={`component-${c.id}-status`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
        <div style={{ marginTop: '1.5rem' }}>
          <button
            className={saveBtnClasses}
            type="submit"
            onClick={this.onSaveClick}
          >
            Submit
          </button>{' '}
          <Link to="/admin/incidents">Cancel</Link>
        </div>
      </form>
    );
  }

}

export default Form;
