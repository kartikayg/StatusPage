/**
 * @fileoverview Presentational component: Create/update component form
 */

import React from 'react';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import _pick from 'lodash/fp/pick';
import { NotificationManager } from 'react-notifications';

import { apiGateway } from '../../../lib/ajax-actions';

class Form extends React.Component {

  static propTypes = {
    component: PropTypes.object,
    groups: PropTypes.arrayOf(PropTypes.object).isRequired,
    history: PropTypes.object,
    componentsCount: PropTypes.number.isRequired,
    onNewComponent: PropTypes.func.isRequired
  }

  constructor(props) {

    super(props);

    // apply default values for a component
    const cmp = Object.assign({
      name: '',
      description: '',
      group_name: '',
      active: true,
      status: 'operational',
      sort_order: props.componentsCount + 1
    }, props.component);

    this.state = {
      inputs: {
        ..._pick(['name', 'description', 'group_name', 'status', 'active', 'sort_order'])(cmp),
        new_group_name: ''
      },
      saving: false
    };

  }

  // on save button click
  onSaveClick = (e) => {

    e.preventDefault();

    if (this.state.saving) {
      return;
    }

    this.setState({ saving: true });

    // post to create the component
    apiGateway.post('/components', { component: this.state.inputs })
      .then(res => {

        // flash
        NotificationManager.success('Component successfully created');

        // fire action to add the new component
        this.props.onNewComponent(res.component);

        // go back to listing
        this.props.history.push('/admin/components');

      })
      .catch(err => {
        NotificationManager.error(err.message);
        this.setState({ saving: false });
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

  render() {

    const header = this.props.component ? 'Update Component' : 'New Component';

    const saveBtnClasses = classNames('ui button positive', {
      loading: this.state.saving,
      disabled: this.state.saving
    });

    return (
      <div>
        <h1 className="ui header">{header}</h1>
        <div style={{ marginTop: '2rem' }}>
          <form className="ui form">
            <div className="field required">
              <label>Component Name</label>
              <input
                type="text"
                name="name"
                onChange={this.onInputChange}
                value={this.state.inputs.name}
              />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea
                name="description"
                rows="4"
                placeholder="Give a helpful description of what this component does"
                onChange={this.onInputChange}
                value={this.state.inputs.description}
              ></textarea>
            </div>
            {this.props.component &&
              <div className="field">
                <label>Status</label>
                <input
                  type="text"
                  name="status"
                  onChange={this.onInputChange}
                  value={this.state.inputs.status}
                />
              </div>
            }
            <div className="field">
              <label>Group Name</label>
              <input
                type="text"
                name="new_group_name"
                onChange={this.onInputChange}
                value={this.state.inputs.new_group_name}
                placeholder="If you want to group components, create a group"
              />
            </div>
            <div className="field">
              <div className="ui checkbox">
                <input
                  type="checkbox"
                  name="active"
                  checked={this.state.inputs.active}
                  onChange={this.onInputChange}
                />
                <label>Active</label>
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
              <Link to="/admin/components" tabIndex="5">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

}

export default Form;
