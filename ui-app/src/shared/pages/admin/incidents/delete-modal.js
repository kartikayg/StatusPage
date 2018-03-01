/**
 * @fileoverview Delete incident modal and the actual deletion
 */

import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { Modal } from 'semantic-ui-react';
import { NotificationManager } from 'react-notifications';

import { apiGateway } from '../../../lib/ajax-actions';

class DeleteModal extends React.Component {

  state = {
    deleting: false
  }

  static propTypes = {
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    onModalClose: PropTypes.func.isRequired,
    removeIncidentAction: PropTypes.func.isRequired
  }

  // close modal
  closeModal = (e) => {

    if (e) {
      e.preventDefault();
    }

    if (this.state.deleting === true) {
      return;
    }

    this.props.onModalClose();

  }


  // delete incident after its confirmed
  confirmDeleteIncident = () => {

    if (this.state.deleting === true) {
      return;
    }

    // change the state and in the callback, make the ajax call.
    this.setState({
      deleting: true
    }, async () => {

      try {

        // make the ajax call to delete
        const resp = await apiGateway.remove(`/incidents/${this.props.id}`);

        this.setState({
          deleting: false
        }, () => {
          this.props.removeIncidentAction(this.props.id);
          this.closeModal();
          NotificationManager.success(resp.message);
        });
      }
      catch (err) {
        NotificationManager.error(err.message);
        this.setState({ deleting: false });
      }
    });

  }

  render() {

    const modalDeleteBtnCls = classNames('negative ui button', {
      loading: this.state.deleting,
      disabled: this.state.deleting
    });

    return (
      <Modal
        size='tiny'
        open={true}
        onClose={this.closeModal}
        closeOnDocumentClick={true}
      >
        <Modal.Header>
          Deleting Incident
        </Modal.Header>
        <Modal.Content>
          <p>
            Are you sure you want to delete the incident:{' '}
            <strong>{this.props.name}</strong>
          </p>
        </Modal.Content>
        <Modal.Actions>
          <a href="#" onClick={this.closeModal}>Cancel</a>{' '}
          <button className={modalDeleteBtnCls} onClick={this.confirmDeleteIncident}>
            Delete
          </button>
        </Modal.Actions>
      </Modal>
    );
  }
}

export default DeleteModal;
