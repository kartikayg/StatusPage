/**
 * @fileoverview Presentational component: Create/update component form
 */

import React from 'react';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import _pick from 'lodash/fp/pick';
import { NotificationManager } from 'react-notifications';

import { StatusDropDown } from '../../../presentation/component-status';
import { apiGateway } from '../../../lib/ajax-actions';

class Form extends React.Component {

  static propTypes = {
    component: PropTypes.object,
    groups: PropTypes.arrayOf(PropTypes.object).isRequired,
    history: PropTypes.object,
    componentsCount: PropTypes.number.isRequired,
    onNewComponent: PropTypes.func,
    onNewGroup: PropTypes.func.isRequired,
    onUpdateComponent: PropTypes.func
  }

  constructor(props) {

    super(props);

    // apply default values for a component
    const cmp = Object.assign({
      name: '',
      description: '',
      active: true,
      status: 'operational',
      sort_order: props.componentsCount + 1,
      group_id: ''
    }, props.component);

    this.state = {
      inputs: {
        ..._pick(['name', 'description', 'status', 'active', 'sort_order', 'group_id'])(cmp),
        new_group_name: ''
      },
      saving: false,
      showCreateNewGroupInput: false
    };

  }

  // creates a component on the backend
  createComponent() {

    // post to create the component
    apiGateway.post('/components', { component: this.state.inputs })
      .then(res => {

        // flash
        NotificationManager.success('Component successfully created');

        // fire action to add the new component
        this.props.onNewComponent(res.component);

        if (res.newGroup) {
          this.props.onNewGroup(res.newGroup);
        }

        // go back to listing
        this.props.history.push('/admin/components');

      })
      .catch(err => {
        NotificationManager.error(err.message);
        this.setState({ saving: false });
      });

  }

  // updates a component on the backend
  updateComponent() {

    apiGateway.patch(`/components/${this.props.component.id}`, { component: this.state.inputs })
      .then(res => {

        // flash
        NotificationManager.success('Component successfully updated');

        // fire action to add the update component
        this.props.onUpdateComponent(res.component);

        if (res.newGroup) {
          this.props.onNewGroup(res.newGroup);
        }

        // go back to listing
        this.props.history.push('/admin/components');

      })
      .catch(err => {
        NotificationManager.error(err.message);
        this.setState({ saving: false });
      });

  }

  // on save button click
  onSaveClick = (e) => {

    e.preventDefault();

    if (this.state.saving) {
      return;
    }

    this.setState({ saving: true });

    if (this.props.component) {
      this.updateComponent();
    }
    else {
      this.createComponent();
    }

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

  // on group select change. a special case to
  // handle creation of new group
  onGroupSelectChange = (e) => {

    const { value } = e.target;

    if (value === 'CREATE_A_NEW_GROUP') {
      this.setState({ showCreateNewGroupInput: true });
    }
    else {
      this.onInputChange(e);
    }

  }

  // on status select change. its a fake drop down
  onStatusSelectChange = (e, { value }) => {
    this.setState(prevState => {
      return {
        inputs: {
          ...prevState.inputs,
          status: value
        }
      };
    });
  }

  onCancelGroupCreation = (e) => {
    e.preventDefault();
    this.setState({ showCreateNewGroupInput: false });
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
                value={this.state.inputs.description || ''}
              ></textarea>
            </div>
            {this.props.component &&
              <div className="field">
                <label>Status</label>
                <StatusDropDown
                  onChange={this.onStatusSelectChange}
                  value={this.state.inputs.status}
                />
              </div>
            }
            {(this.props.groups.length === 0 || this.state.showCreateNewGroupInput) &&
              <div className="field">
                <label>Group</label>
                <input
                  type="text"
                  name="new_group_name"
                  onChange={this.onInputChange}
                  value={this.state.inputs.new_group_name}
                  placeholder={this.props.groups.length === 0
                                ? 'If you want to group components, create a group'
                                : 'create a group'
                              }
                />
                {this.props.groups.length > 0 &&
                  <div style={{ margin: '7px 0' }}>
                    <a href="#" onClick={this.onCancelGroupCreation}>Cancel</a>
                  </div>
                }
              </div>
            }
            {this.props.groups.length > 0 && !this.state.showCreateNewGroupInput &&
              <div className="field">
                <label>Group</label>
                <select
                  className="ui search dropdown"
                  name="group_id"
                  onChange={this.onGroupSelectChange}
                  value={this.state.inputs.group_id || ''}
                >
                    <option value="">No grouping for this component</option>
                    <option value="CREATE_A_NEW_GROUP">Create a new group</option>
                    <option value="">-----------------------------------------</option>
                    {this.props.groups.map(g => {
                      return <option key={g.id} value={g.id} >{g.name}</option>;
                    })}
                </select>
              </div>
            }
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
