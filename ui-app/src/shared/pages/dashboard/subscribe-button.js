/**
 * @fileoverview Subscribe button plus the popup
 */

import React from 'react';
import { Button, Popup, Tab, Menu, Icon } from 'semantic-ui-react';
import { NotificationManager } from 'react-notifications';

import flashMsgStorage from '../../lib/flash-message-storage';
import { apiGateway } from '../../lib/ajax-actions';

class SubscribeButton extends React.Component {

  state = {
    inputs: {
      email: '',
      uri: ''
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
        uri: ''
      },
      ajax: false
    });
  }

  createSubscription = async (obj) => {

    this.setState({ ajax: true }, async () => {

      try {

        const saved = await apiGateway.post('/subscriptions', { subscription: obj });

        // store flash message to show after page reload
        flashMsgStorage.add('success', 'Subscription created', 8000);

        window.location = `/manage_subscription/${saved.id}`; // eslint-disable-line no-undef

      }
      catch (err) {
        this.setState({ ajax: false });
        NotificationManager.error(err.message);
      }

    });

  }

  // create email subscription
  onSubscribeViaEmail = async () => {

    const { email } = this.state.inputs;

    if (!email || this.state.ajax) {
      return;
    }

    await this.createSubscription({
      type: 'email',
      email
    });

  }

  // create webhook subscription
  onSubscribeViaWebhook = async () => {

    const { uri } = this.state.inputs;

    if (!uri || this.state.ajax) {
      return;
    }

    await this.createSubscription({
      type: 'webhook',
      uri
    });

  }

  render() {

    // subscribe button
    const button = <Button primary content='SUBSCRIBE TO UPDATES' />;

    const loadingCls = this.state.ajax ? 'loading' : '';

    const emailIcon = (
      <Menu.Item name='envelope' key='email'>
        <Icon name='envelope' size='large' title='Via email' />
      </Menu.Item>
    );

    const emailContent = (
      <Tab.Pane attached='bottom'>
        <div>
          <h4 className='ui center aligned header'>Get notified by email</h4>
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
          <h4 className='ui center aligned header'>Get notified by webhook</h4>
          <div className="ui input fluid">
            <input
              type="text"
              placeholder="url"
              value={this.state.inputs.uri}
              onChange={this.onInputChange}
              name='uri'
            />
          </div>
          <br />
          <button className={`ui button fluid ${loadingCls}`} onClick={this.onSubscribeViaWebhook}>
            Subscribe via webhook notification
          </button>
        </div>
      </Tab.Pane>
    );

    const panes = [
      { menuItem: emailIcon, render: () => emailContent }, // eslint-disable-line arrow-body-style
      { menuItem: webIcon, render: () => webContent } // eslint-disable-line arrow-body-style
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
