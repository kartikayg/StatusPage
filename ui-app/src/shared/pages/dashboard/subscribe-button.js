/**
 * @fileoverview
 */

import React from 'react';
import { Button, Popup, Tab, Menu, Icon } from 'semantic-ui-react';
import { NotificationManager } from 'react-notifications';

import { apiGateway } from '../../lib/ajax-actions';

class SubscribeButton extends React.Component {

  state = {
    inputs: {
      email: '',
      url: ''
    },
    ajax: false
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

  onPopupClose = () => {
    this.setState({
      inputs: {
        email: '',
        url: ''
      }
    });
  }

  onSubscribeViaEmail = () => {

    const { email } = this.state.inputs;

    if (!email || this.state.ajax) {
      return;
    }

    this.setState({ ajax: true }, async () => {
      try {

        const subscription = {
          type: 'email',
          email
        };

        const saved = await apiGateway.post('/subscriptions', { subscription });
        NotificationManager.success('good to go');

        window.location = `/manage_subscription/${saved.id}`;

      }
      catch (err) {
        this.setState({ ajax: false });
        NotificationManager.error(err.message);
      }
    });

  }

  render() {

    // subscribe button
    const button = <Button 
      primary
      content='SUBSCRIBE TO UPDATES'
      style={{ float: 'right' }}
    />;

    const loadingCls = this.state.ajax ? 'loading' : '';

    const emailIcon = (
      <Menu.Item name='envelope' key='email'>
        <Icon name='envelope' size='large' title='Via email' />
      </Menu.Item>
    );

    const emailContent = (
      <Tab.Pane attached='bottom'>
        <div>
          <p>Get notififed by email</p>
          <div className="ui input fluid">
            <input
              type="text"
              placeholder="email address"
              value={this.state.inputs.email}
              onChange={this.onInputChange}
              name='email'
            />
          </div>
          <br />
          <button className={`ui button fluid ${loadingCls}`} onClick={this.onSubscribeViaEmail}>
            Subscribe via email
          </button>
        </div>
      </Tab.Pane>
    );

    const webIcon = (
      <Menu.Item name='download' key='webhook'>
        <Icon name='download' size='large' title='Via Webhook' />
      </Menu.Item>
    );

    const webContent = (
      <Tab.Pane attached='bottom'>
        <div>
          <p>Get notififed by webhook</p>
          <div className="ui input fluid">
            <input
              type="text"
              placeholder="url"
              value={this.state.inputs.url}
              onChange={this.onInputChange}
              name='url'
            />
          </div>
          <br />
          <button className={`ui button fluid ${loadingCls}`}>
            Subscribe via webhook notification
          </button>
        </div>
      </Tab.Pane>
    );

    const panes = [
      { menuItem: emailIcon, render: () => emailContent },
      { menuItem: webIcon, render: () => webContent }
    ];

    // modal
    const modal = (
      <Tab menu={{ attached: 'top' }} panes={panes} style={{ minWidth: '350px' }} />
    );

    return (
      <Popup
        trigger={button}
        content={modal}
        on='click'
        position='bottom left'
        className='flowing'
        onClose={this.onPopupClose}
      />
    );

  }

}

export default SubscribeButton;