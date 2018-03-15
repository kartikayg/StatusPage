/**
 * @fileoverview Listing of suscriptions (of all types)
 */
import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import _find from 'lodash/fp/find';
import { Modal } from 'semantic-ui-react';
import { NotificationManager } from 'react-notifications';

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

  setRemoveSubscriptionState = (upd, callback) => {
    this.setState(prevState => {
      return {
        removeSubscription: {
          ...prevState.removeSubscription,
          ...upd
        }
      };
    }, callback);
  }

  onTabClick = (e) => {
    this.props.history.push(`/admin/subscriptions/${e.target.dataset.tab}`);
  }

  // on delete icon click, show the modal
  onDeleteSubscriptionClick = (id) => (e) => { // eslint-disable-line arrow-body-style

    e.preventDefault();

    // make sure the id is valid
    const sub = _find(['id', id])(this.props.subscriptions);

    if (!sub) {
      return;
    }

    // show a confirm modal
    this.setRemoveSubscriptionState({
      id,
      name: sub.email || sub.uri,
      showModal: true,
      ajax: false
    });
  }

  // close delete confirm modal
  closeDeleteConfirmModal = (e) => {

    if (e) {
      e.preventDefault();
    }

    this.setState({
      removeSubscription: {
        id: null,
        name: null,
        showModal: false
      }
    });

  }

  // delete subscription after its confirmed
  confirmDeleteSubscription = () => {

    if (this.state.removeSubscription.ajax === true) {
      return;
    }

    const { id } = this.state.removeSubscription;

    // change the state and in the callback, make the ajax call.
    this.setRemoveSubscriptionState({
      ajax: true
    }, async () => {

      try {

        // make the ajax call to delete
        const resp = await apiGateway.remove(`/subscriptions/${id}`);

        this.setRemoveSubscriptionState({
          ajax: false
        }, () => {
          this.props.removeSubscriptionAction(id);
          this.closeDeleteConfirmModal();
          NotificationManager.success(resp.message);
        });
      }
      catch (err) {
        NotificationManager.error(err.message);
        this.setRemoveSubscriptionState({ ajax: false });
      }
    });

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

    const modalDeleteBtnCls = classNames('negative ui button', {
      loading: this.state.removeSubscription.ajax,
      disabled: this.state.removeSubscription.ajax
    });

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
        {
          this.state.removeSubscription.showModal &&
          (
            <Modal
              size='tiny'
              open={true}
              onClose={this.closeDeleteConfirmModal}
              closeOnDocumentClick={true}
            >
              <Modal.Header>
                Deleting Subscription
              </Modal.Header>
              <Modal.Content>
                <p>
                  Are you sure you want to delete the subscription for:{' '}
                  <strong>{this.state.removeSubscription.name}</strong>
                </p>
              </Modal.Content>
              <Modal.Actions>
                <a href="#" onClick={this.closeDeleteConfirmModal}>Cancel</a>{' '}
                <button className={modalDeleteBtnCls} onClick={this.confirmDeleteSubscription}>
                  Delete
                </button>
              </Modal.Actions>
            </Modal>
          )
        }
      </div>
    );

  }

}

export default Listing;
