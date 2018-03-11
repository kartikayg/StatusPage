/**
 * @fileoverview Incidents listing for dashboard page
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import _find from 'lodash/fp/find';

import { getHighestImpactStatus } from '../../../redux/helpers/incidents';
import { getColor } from '../../../presentation/component-status';
import { IncidentRow } from '../incidents/realtime/list/unresolved';

import DeleteModal from '../incidents/delete-modal';

class IncidentsListing extends React.Component {

  static propTypes = {
    incidents: PropTypes.arrayOf(PropTypes.object).isRequired,
    removeIncidentAction: PropTypes.func.isRequired
  }

  state = {
    removeIncident: {
      id: null,
      name: null
    }
  }

  // close delete confirm modal
  closeDeleteConfirmModal = () => {
    this.setState({
      removeIncident: {
        id: null,
        name: null
      }
    });
  }

  // on delete icon click, show the modal
  onDeleteIncidentClick = (id) => (e) => { // eslint-disable-line arrow-body-style

    e.preventDefault();

    // make sure the id is valid
    const inc = _find(['id', id])(this.props.incidents);

    if (!inc) {
      return;
    }

    // show a confirm modal
    this.setState({
      removeIncident: {
        id,
        name: inc.name
      }
    });

  }

  render() {

    const highestImpactStatus = getHighestImpactStatus(this.props.incidents);

    return (
      <div>
        <div>
          <Link to='/admin/incidents/add' className='positive ui button'>
            Add Incident
          </Link>
        </div>
        <table className="ui celled striped table large">
          <thead>
            <tr>
              <th colSpan="3" className={`${getColor(highestImpactStatus)} ui message`}>
                Unresolved Incidents ({this.props.incidents.length})
              </th>
            </tr>
          </thead>
          <tbody>
            {
              this.props.incidents.length === 0 && (
                <tr>
                  <td colSpan="3">
                    There are no unresolved incidents happening right now.
                  </td>
                </tr>
              )
            }
            {
              this.props.incidents.length > 0 && this.props.incidents.map(i => {
                return <IncidentRow
                  key={i.id}
                  incident={i}
                  onDeleteIncidentClick={this.onDeleteIncidentClick}
                  showScheduledIcon={true}
                />;
              })
            }
          </tbody>
        </table>

        {/* delete modal */}
          {
            this.state.removeIncident.id !== null && <DeleteModal
              id={this.state.removeIncident.id}
              name={this.state.removeIncident.name}
              onModalClose={this.closeDeleteConfirmModal}
              removeIncidentAction={this.props.removeIncidentAction}
            />
          }

      </div>
    );
  }

}

export default IncidentsListing;
