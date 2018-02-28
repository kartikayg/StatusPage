/**
 * @fileoverview Login Page
 */

import React, { Component } from 'react';
import classNames from 'classnames';
import { Helmet } from 'react-helmet';
import { NotificationManager } from 'react-notifications';

import { executeCall } from '../lib/ajax-actions';
import auth from '../../client/auth';

class LoginForm extends Component {

  state = {
    inputs: {
      username: {
        value: '',
        state: 'active'
      },
      password: {
        value: '',
        state: 'active'
      }
    },
    saving: false
  }

  // on login
  onLoginClick = (e) => {

    e.preventDefault();

    if (this.state.saving) {
      return;
    }

    const toSave = {};

    // validate fields, basically all are required
    let failure = false;
    Object.keys(this.state.inputs).forEach(name => {
      toSave[name] = this.state.inputs[name].value;
      if (!toSave[name]) {
        failure = true;
        this.changeInputState(name, { state: 'error' });
      }
    });

    if (failure) {
      return;
    }

    this.setState({ saving: true });

    executeCall('/login', 'post', { data: toSave })
      .then(res => {
        // save the token and redirect to admin
        auth.token = res.token;
        location.href = '/admin'; // eslint-disable-line
      })
      .catch(err => {
        NotificationManager.error(err.message);
        this.setState({ saving: false });
      });

  }

  // on input change, update the state
  onInputChange = (e) => {
    const { name, value } = e.target;
    this.changeInputState(name, { value, state: 'active' });
  }

  /**
   * Updates input state in react
   * @param {string} name - input name
   * @param {object} change - state changes
   */
  changeInputState = (name, change) => {
    this.setState(prevState => {
      return {
        inputs: {
          ...prevState.inputs,
          [name]: {
            ...prevState.inputs[name],
            ...change
          }
        }
      };
    });
  }

  // renders the component
  render() {

    const gridStyle = {
      height: '100%'
    };

    const columnStyle = {
      maxWidth: '450px'
    };

    const submitBtnClasses = classNames('ui fluid large submit button blue', {
      loading: this.state.saving,
      disabled: this.state.saving
    });

    return (
      <div>
        <Helmet>
          <title>Login</title>
        </Helmet>
        <div className="ui middle aligned center aligned grid" style={gridStyle}>
          <div className="column" style={columnStyle}>
            <h2 className="ui teal image header">
              <div className="content">
                Log-in to your account
              </div>
            </h2>
            <form className="ui large form" onSubmit={this.onLoginClick}>
              <div className="ui stacked segment">
                <div className={`field ${this.state.inputs.username.state}`}>
                  <div className="ui left icon input">
                    <i className="user icon"></i>
                    <input
                      type="text"
                      name="username"
                      placeholder="Username"
                      onChange={this.onInputChange}
                      value={this.state.inputs.username.value}
                    />
                  </div>
                </div>
                <div className={`field ${this.state.inputs.password.state}`}>
                  <div className="ui left icon input">
                    <i className="lock icon"></i>
                    <input
                      type="password"
                      name="password"
                      placeholder="Password"
                      onChange={this.onInputChange}
                      value={this.state.inputs.password.value}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          this.onLoginClick(e);
                        }
                      }}
                    />
                  </div>
                </div>
                <div className={submitBtnClasses} onClick={this.onLoginClick}>
                  Login
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default LoginForm;
