/**
 * @fileoverview Create a new backfilled incident
 */

import React from 'react';
import PropTypes from 'prop-types';

import { StatusDropDown } from '../../../../presentation/component-status';

class NewIncidentForm extends React.Component {

  state = {
    saving: false,
    inputs: {
      name: '',
      message: '',
      components_impact_status: '',
      displayed_at: ''
    }
  }

  // on input change, update the state
  onInputChange = (e) => {

    const { target } = e;
    const { name, value } = target;

    this.setState(prevState => {
      return {
        inputs: {
          ...prevState.inputs,
          [name]: value
        }
      };
    });

  }

  onImpactStatusChange = (e, { name, value }) => {
    this.setState(prevState => {
      return {
        inputs: {
          ...prevState.inputs,
          [name]: value
        }
      };
    });
  }

  render() {
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
              <input
                type="text"
                name="displayed_at"
                onChange={this.onInputChange}
                value={this.state.inputs.displayed_at}
              />
            </div>
            <div className='field'>
              <label>Impact (optional)</label>
              <StatusDropDown
                value={this.state.inputs.components_impact_status}
                onChange={this.onImpactStatusChange}
                name='components_impact_status'
                optional={true}
              />
            </div>
          </form>
        </div>
      </div>
    );
  }

}

export default NewIncidentForm;
