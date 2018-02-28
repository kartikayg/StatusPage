/**
 * @fileoverview Listing of suscriptions (of all types)
 */
import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

import EmailList from './email/list';
import WebhookList from './webhook/list';
import { filterByType } from '../../../redux/helpers/subscriptions';
import { apiGateway } from '../../../lib/ajax-actions';

const subTypes = ['email', 'webhook'];

class Listing extends React.Component {

  constructor(props) {

    super(props);

    this.state = {
      tab: props.match.params.tab || subTypes[0],
      removeSubscription: {
        showModal: false,
        id: null,
        name: null,
        ajax: false
      }
    };
  }

  static propTypes = {
    match: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
    subscriptions: PropTypes.arrayOf(PropTypes.object).isRequired,
    removeSubscriptionAction: PropTypes.func.isRequired
  }

  onTabClick = (e) => {
    this.props.history.push(`/admin/subscriptions/${e.target.dataset.tab}`);
  }

  // on delete icon click, show the modal
  onDeleteSubscriptionClick = (id) => (e) => { // eslint-disable-line arrow-body-style
    e.preventDefault();
  }

  render() {

    const noBorder = {
      borderLeft: '0px',
      borderRight: '0px',
      borderBottom: '0px',
      paddingLeft: '0px'
    };

    const emailTabClass = classNames('item', { active: this.state.tab === 'email' });
    const webhookTabClass = classNames('item', { active: this.state.tab === 'webhook' });

    return (
      <div>
        <h1 className='ui header' style={{ marginBottom: '2.5rem' }}>Subscriptions</h1>
        <div className="ui top attached tabular menu">
          <a className={emailTabClass} data-tab='email' onClick={this.onTabClick}>
            Email
          </a>
          <a className={webhookTabClass} data-tab='webhook' onClick={this.onTabClick}>
            Webhook
          </a>
        </div>
        {this.state.tab === 'email' &&
          <div className="ui bottom attached tab segment active" style={ noBorder }>
            <EmailList
              subscriptions={filterByType(this.props.subscriptions, 'email')}
              onDeleteSubscriptionClick={this.onDeleteSubscriptionClick}
            />
          </div>
        }
        {this.state.tab === 'webhook' &&
          <div className="ui bottom attached tab segment active" style={ noBorder }>
            <WebhookList
              subscriptions={filterByType(this.props.subscriptions, 'webhook')}
              onDeleteSubscriptionClick={this.onDeleteSubscriptionClick}
            />
          </div>
        }
      </div>
    );

  }

}

export default Listing;
