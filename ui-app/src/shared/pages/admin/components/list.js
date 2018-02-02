/**
 * @fileoverview Presentational component: Listing of components
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import ComponentsTable from './list/table';

/**
 *
 */
class Listing extends React.Component {

  onSortEnd = ({ oldIndex, newIndex }) => {

    if (oldIndex === newIndex) {
      return;
    }

    console.log(oldIndex);
    console.log(newIndex);
    console.log(this.props.componentsByGroup);

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
  componentsByGroup: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default Listing;
