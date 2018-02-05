/**
 * @fileoverview
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import _pick from 'lodash/fp/pick';
const _each = require('lodash/fp/each').convert({ cap: false });

import { StatusDropDown } from '../../../../presentation/component-status';

// statuses for incident
const statuses = [
  { key: 'investigating', value: 'Investigating' },
  { key: 'identified', value: 'Identified' },
  { key: 'monitoring', value: 'Monitoring' },
  { key: 'resolved', value: 'Resolved' }
];

class Form extends React.Component {

  static propTypes = {
    components: PropTypes.arrayOf(PropTypes.object).isRequired
  }

  constructor(props) {

    super(props);

    const cmpState = {};

    props.components.forEach(c => {
      cmpState[c.id] = {
        checked: false,
        status: c.status
      };
    });

    this.state = {
      inputs: {
        name: '',
        type: 'realtime',
        components: cmpState,
        status: 'investigating',
        message: '',
        do_notify_subscribers: true
      },
      saving: false,
      action: 'New'
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
  onSaveClick = (e) => {

    e.preventDefault();

    if (this.state.saving) {
      return;
    }

    this.setState({ saving: true });

    // create data object
    const data = _pick([
      'name',
      'status',
      'message',
      'do_notify_subscribers',
      'type']
    )(this.state.inputs);

    data.components = {};

    // add components that are checked
    _each((o, id) => {
      if (o.checked == true) {
        data.components[id] = o.status;
      }
    })(this.state.inputs.components);

    

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
            {statuses.map(s => {
              return <option key={s.key} value={s.key}>{s.value}</option>;
            })}
          </select>
        </div>
        <div className={`field ${this.state.action === 'New' ? 'required' : ''}`}>
          <label>Message</label>
          <textarea
            name="message"
            rows="6"
            onChange={this.onInputChange}
            value={this.state.inputs.message}
          ></textarea>
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
