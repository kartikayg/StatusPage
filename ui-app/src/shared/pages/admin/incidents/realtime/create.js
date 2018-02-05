/**
 * @fileoverview
 */

import React from 'react';
import PropTypes from 'prop-types';

class NewIncident extends React.Component {

  static propTypes = {
    components: PropTypes.arrayOf(PropTypes.object).isRequired
  }

  constructor(props) {

    super(props);

    this.state = {
      inputs: {
        name: '',
        type: 'realtime',
        components: {},
        status: '',
      },
      saving: false
    };

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

  render() {
    return (
      <div>
        <h1 className="ui header">New Incident</h1>
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
            <select
              className="ui search dropdown"
              name="status"
              onChange={this.onInputChange}
              value={this.state.inputs.status}
            >
            </select>
          </form>
        </div>
      </div>
    );
  }

}

export default NewIncident;
