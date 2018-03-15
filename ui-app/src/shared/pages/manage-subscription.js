/**
 * @fileoverview Manage Subscription page - public page
 */

import React from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { NotificationManager } from 'react-notifications';
import _sortBy from 'lodash/fp/sortBy';
import _filter from 'lodash/fp/filter';
import _getOr from 'lodash/fp/getOr';

import flashMsgStorage from '../lib/flash-message-storage';
import { apiGateway } from '../lib/ajax-actions';

const _each = require('lodash/fp/each').convert({ cap: false });

class ManageSubscriptionDisplay extends React.Component {

  constructor(props) {

    super(props);

    // find the subscription
    const { subscriptionId } = props.match.params;
    const subscriptionObj = props.subscriptions.find(sub => {
      return sub.id === subscriptionId;
    });

    const cmpState = {};

    // set the component state, whether its selected or not.
    if (subscriptionObj) {

      const currCmpts = _getOr([], 'components', subscriptionObj);

      props.components.forEach(c => {
        cmpState[c.id] = {
          // if no components at the subscription level, that means all
          // components are checked.
          checked: currCmpts.length === 0 || currCmpts.includes(c.id)
        };
      });
    }

    this.state = {
      components: cmpState,
      subscriptionObj,
      saving: false,
      unsubscribing: false
    };

  }

  static propTypes = {
    components: PropTypes.arrayOf(PropTypes.object).isRequired,
    subscriptions: PropTypes.arrayOf(PropTypes.object).isRequired,
    match: PropTypes.object.isRequired
  }

  // on confirm link resend
  onSendConfirmationLink = async (e) => {

    e.preventDefault();

    try {
      const resp = await apiGateway.get(`/subscriptions/${this.state.subscriptionObj.id}/send_confirmation_link`);
      NotificationManager.success(resp.message);
    }
    catch (err) {
      NotificationManager.error(err.message);
    }

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

    this.setState(prevState => {
      return {
        components: {
          ...prevState.components,
          [id]: {
            ...prevState.components[id],
            checked: value
          }
        }
      };
    });

  }

  // unsubscribe (delete)
  onUnsubscribeAllClick = async (e) => {

    if (e) {
      e.preventDefault();
    }

    if (this.state.unsubscribing) {
      return;
    }

    /* eslint-disable function-paren-newline */

    this.setState({ unsubscribing: true }, async () => {

      try {

        const resp = await apiGateway.remove(`/subscriptions/${this.state.subscriptionObj.id}`);
        flashMsgStorage.add('success', resp.message);
        window.location = '/'; // eslint-disable-line no-undef
      }
      catch (err) {
        this.setState({ unsubscribing: false });
        NotificationManager.error(err.message);
      }

    });

    /* eslint-enable function-paren-newline */

  }

  // save preference
  onSaveClick = async (e) => {

    if (e) {
      e.preventDefault();
    }

    if (this.state.saving) {
      return;
    }

    let checkedComponents = [];

    // get checked components
    _each((o, id) => {
      if (o.checked === true) {
        checkedComponents.push(id);
      }
    })(this.state.components);

    // if no checked, then unsubscribe all
    if (checkedComponents.length === 0) {
      await this.onUnsubscribeAllClick();
    }
    else {
      // if all are checked, then save as empty array. this means
      // that all components (including future) are auto subscribed
      if (this.props.components.length === checkedComponents.length) {
        checkedComponents = [];
      }

      /* eslint-disable function-paren-newline */

      this.setState({ saving: true }, async () => {

        try {
          const url = `/subscriptions/${this.state.subscriptionObj.id}/manage_components`;
          await apiGateway.patch(url, { components: checkedComponents });
          this.setState({ saving: false });
          NotificationManager.success('Subscription updated.');
        }
        catch (err) {
          this.setState({ unsubscribing: false });
          NotificationManager.error(err.message);
        }

      });
    }

    /* eslint-enable function-paren-newline */

  }

  render() {

    if (!this.state.subscriptionObj) {
      flashMsgStorage.add('warning', 'Subscription not found.');
      return <Redirect to='/' />;
    }

    const saveBtnClasses = classNames('ui button positive small', {
      loading: this.state.saving,
      disabled: this.state.saving || this.state.unsubscribing
    });

    const unsubBtnClasses = classNames('ui button small', {
      loading: this.state.unsubscribing,
      disabled: this.state.saving || this.state.unsubscribing
    });

    return (
      <div>
        <Helmet>
          <title>{process.env.COMPANY_NAME} - Manage Subscription</title>
        </Helmet>
        <div className="ui main text container" style={{ marginTop: '5rem', maxWidth: '700px !important' }}>
          <div>
            <h1 className='ui header aligned center'>{process.env.COMPANY_NAME}</h1>
            <h2 className='ui header aligned center' style={{ margin: '1rem 0 2rem 0', color: 'gray' }}>
              {
                this.state.subscriptionObj.type === 'email' &&
                <div>Email subscription: {this.state.subscriptionObj.email}</div>
              }
              {
                this.state.subscriptionObj.type === 'webhook' &&
                <div>Webhook subscription: {this.state.subscriptionObj.uri}</div>
              }
            </h2>
          </div>
          {
            this.state.subscriptionObj.is_confirmed === false && (
              <div className='ui warning message tiny aligned center' style={{ marginBottom: '2rem' }}>
                This subscription is not confirmed yet. Please check your inbox for the email or{' '}
                <a href='#' onClick={this.onSendConfirmationLink}>resend confirmation link</a>.
              </div>
            )
          }

          <form className="ui form" style={{ margin: '1rem 0 2rem 0' }}>

            <div className="field">
              <label style={{ fontSize: '1.2rem' }}>Components</label>
              <div style={{ marginTop: '-5px', fontStyle: 'italic' }}>
                Select the components that you want to receive notification for,{' '}
                in case there is an incident impacting it.
              </div>
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
                              checked={this.state.components[c.id].checked}
                              onChange={this.onComponentCheckboxChange}
                              className=" ui large form"
                            />
                          </td>
                          <td>{c.name}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <button className={saveBtnClasses} onClick={this.onSaveClick}>
                Save Preference
              </button>
              {'  '}
              <button className={unsubBtnClasses} onClick={this.onUnsubscribeAllClick}>
                Unsubscribe from all
              </button>
            </div>

          </form>

          <div className="ui divider"></div>

          <div style={{ marginTop: '-0.40rem', textAlign: 'center' }}>
            <a href='/' style={{ fontSize: '1rem' }}>
              View Status Page
            </a>
          </div>

        </div>
      </div>
    );

  }

}

// mapping redux state and actions to props
const mapStateToProps = (state) => {
  return {
    subscriptions: state.subscriptions,
    components: _sortBy(['sort_order', 'created_at'])(_filter('active')(state.components))
  };
};

const ManageSubscriptionPage = connect(mapStateToProps)(ManageSubscriptionDisplay);

export default ManageSubscriptionPage;
