/**
 * @fileoverview Renders the table of components
 */

import React from 'react';
import PropTypes from 'prop-types';
import { SortableContainer } from 'react-sortable-hoc';

import SingleComponent from './single-component';
import MultipleComponents from './multiple-components';


/**
 * Creates the sortable for the components
 */
const Table = SortableContainer(({ componentsByGroup }) => {

  return (
    <div className="ui relaxed divided list">
      {componentsByGroup.map((cg, idx) => {
        if (cg.group_id) {
          return <MultipleComponents key={cg.group_id} index={idx} group={cg} />;
        }
        return <SingleComponent key={cg.components[0].id} index={idx} component={cg.components[0]} />; // eslint-disable-line max-len
      })}
    </div>
  );
});

Table.propTypes = {
  componentsByGroup: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default Table;
