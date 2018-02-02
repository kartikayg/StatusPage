/**
 * @fileoverview Presentational component: Listing of components
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import _cloneDeep from 'lodash/fp/cloneDeep';
import { NotificationManager } from 'react-notifications';

import ComponentsTable from './list/table';
import { apiGateway } from '../../../lib/ajax-actions';

/**
 *
 */
class Listing extends React.Component {

  // on sort end, move the components if needed
  onSortEnd = ({ oldIndex, newIndex }) => {

    if (oldIndex === newIndex) {
      return;
    }

    // will store components that need to be updated
    const toUpdate = [];

    // clone it so we don't modify the props
    const cloneObj = _cloneDeep(this.props.componentsByGroup);

    // remove the item from the old index and add to new index
    cloneObj.splice(oldIndex, 1);
    cloneObj.splice(newIndex, 0, this.props.componentsByGroup[oldIndex]);

    // now lets through and re-adjust the sort order. if its changing,
    // add it to the update array
    let sortOrder = 1;
    cloneObj.forEach(cg => {
      cg.components.forEach(c => {
        if (c.sort_order !== sortOrder) {
          toUpdate.push({ id: c.id, sort_order: sortOrder });
        }
        sortOrder += 1;
      });
    });

    // shouldn't really happen, but just in case
    if (toUpdate.length === 0) {
      return;
    }

    // first update the state, so the UI reflects the change and then make the
    // api call
    toUpdate.forEach(this.props.onComponentSortUpdate);

    const calls = toUpdate.map(c => {
      return apiGateway.patch(`/components/${c.id}`, { component: c });
    });

    Promise.all(calls)
      .then(() => {
        NotificationManager.success('Sort order successfully updated');
      })
      .catch(err => {
        NotificationManager.error(err.message);
      });

  }

  render() {

    let body;

    // if no components found
    if (this.props.componentsByGroup.length === 0) {
      body = (
        <div>
          <p><strong>No components found</strong></p>
        </div>
      );
    }
    else {
      body = (
        <div>
          <ComponentsTable
            useDragHandle={false}
            onSortEnd={this.onSortEnd}
            componentsByGroup={this.props.componentsByGroup}
          />
          <div style={{ marginTop: '2rem' }}>
            <i>* Drag to sort the components.</i>
          </div>
        </div>
      );
    }

    return (
      <div>
        <h1 className='ui header'>Components</h1>
        <div style={{ margin: '2rem 0' }}>
          <Link to='/admin/components/add' className='positive ui button'>
            Add Component
          </Link>
        </div>
        {body}
      </div>
    );
  }

}

Listing.propTypes = {
  componentsByGroup: PropTypes.arrayOf(PropTypes.object).isRequired,
  onComponentSortUpdate: PropTypes.func.isRequired
};

export default Listing;
