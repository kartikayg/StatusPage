/**
 * @fileoverview Create a new backfilled incident
 */

import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import DatePicker from 'react-datepicker';
import _pick from 'lodash/fp/pick';
import { NotificationManager } from 'react-notifications';
import moment from 'moment-timezone';

import { apiGateway } from '../../../../lib/ajax-actions';
import { StatusDropDown } from '../../../../presentation/component-status';

class NewIncidentForm extends React.Component {

  static propTypes = {
    addIncidentAction: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired
  }

  state = {
    saving: false,
    inputs: {
      name: '',
      message: '',
      components_impact_status: '',
      displayed_at: null,
      type: 'backfilled'
    }
  }

  // on input change, update the state
  onInputChange = (e) => {
    const { target } = e;
    const { name, value } = target;
    this.updateInputValue(name, value);
  }

  // update an input's value in the state
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

  // on save button
  onSaveClick = (e) => {

    e.preventDefault();

    if (this.state.saving) {
      return;
    }

    this.setState({ saving: true }, async () => {

      try {

        // create incident data object
        const incData = _pick([
          'name',
          'message',
          'type',
          'components_impact_status'
        ])(this.state.inputs);

        if (this.state.inputs.displayed_at) {
          incData.displayed_at = this.state.inputs.displayed_at
            .set('second', 0)
            .set('minutes', 0)
            .set('hours', 0)
            .format();
        }

        const saved = await apiGateway.post('/incidents', { incident: incData });

        this.setState({ saving: false }, () => {
          this.props.addIncidentAction(saved);
          NotificationManager.success('Incident successfully created');
          this.props.history.push('/admin/incidents');
        });

      }
      catch (err) {
        this.setState({ saving: false });
        NotificationManager.error(err.message);
      }

    });

  }

  render() {

    /* eslint-disable brace-style */

    const saveBtnClasses = classNames('ui button positive', {
      loading: this.state.saving,
      disabled: this.state.saving
    });

    return (
      <div>
        <h1 className="ui header">Backfill an Incident</h1>
        <div style={{ marginTop: '2rem' }}>
          <form className="ui form">
            <div className="field required">
              <label>Incident Name</label>
              <input
                type="text"
                name="name"
                onChange={this.onInputChange}
                value={this.state.inputs.name}
              />
            </div>
            <div className='field required'>
              <label>Message</label>
              <textarea
                name="message"
                rows="6"
                onChange={this.onInputChange}
                value={this.state.inputs.message}
              ></textarea>
            </div>
            <div className='field required'>
              <label>Incident Date</label>
              <DatePicker
                selected={this.state.inputs.displayed_at}
                onChange={(date) => { this.updateInputValue('displayed_at', date); }}
                maxDate={moment()}
              />
            </div>
            <div className='field required'>
              <label>Impact</label>
              <StatusDropDown
                value={this.state.inputs.components_impact_status}
                onChange={(e, { name, value }) => { this.updateInputValue(name, value); }}
                name='components_impact_status'
                optional={true}
              />
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <button
                className={saveBtnClasses}
                type="submit"
                onClick={this.onSaveClick}
              >
                Submit
              </button>{' '}
              <Link to="/admin/incidents" tabIndex="5">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    );

    /* eslint-enable brace-style */

  }

}

export default NewIncidentForm;
