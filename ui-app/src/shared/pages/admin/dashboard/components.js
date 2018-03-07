/**
 * @fileoverview Components listing for dashboard page
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { NotificationManager } from 'react-notifications';

import { apiGateway } from '../../../lib/ajax-actions';
import { StatusDropDown } from '../../../presentation/component-status';

class ComponentsListing extends React.Component {

  static propTypes = {
    components: PropTypes.arrayOf(PropTypes.object).isRequired,
    updateComponentStatusAction: PropTypes.func.isRequired
  }

  // on component status change
  onComponentStatusChange = (e, { name, value }) => {

    this.props.updateComponentStatusAction({
      id: name, status: value
    });

    const c = { id: name, status: value };

    apiGateway.patch(`/components/${c.id}`, { component: c })
      .then(() => {
        NotificationManager.success('Component status updated.');
      })
      .catch(err => {
        NotificationManager.error(err.message);
      });

  }

  render() {
    return (
      <div>
        <div>
          <Link to='/admin/components/add' className='positive ui button'>
            Add Component
          </Link>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <table className="ui basic celled table large">
            <thead>
              <tr>
                <th colSpan="2">
                  Components
                </th>
              </tr>
            </thead>
            <tbody>
              {
                this.props.components.length === 0 && (
                  <tr>
                    <td colSpan="2">
                      There are no active components.
                    </td>
                  </tr>
                )
              }
              {
                this.props.components.length > 0 && this.props.components.map(c => {
                  return (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td className="right aligned five wide">
                        <StatusDropDown
                          value={c.status}
                          onChange={this.onComponentStatusChange}
                          name={c.id}
                        />
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default ComponentsListing;
