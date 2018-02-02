/**
 * @fileoverview Render a single component
 */

import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { SortableElement } from 'react-sortable-hoc';

import { StatusIcon } from '../../../../components/component-status';

const SingleComponent = SortableElement(({ component }) => {
  return (
    <div className="item">
      <table className="ui large very basic table">
        <tbody>
          <tr>
            <td><StatusIcon status={component.status} /> {component.name} {!component.active ? '(Inactive)' : ''}</td>
            <td className="right aligned">
              <Link to={`/admin/components/edit/${component.id}`} className="ui button">Edit</Link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
});

SingleComponent.propTypes = {
  component: PropTypes.object.isRequired
};

export default SingleComponent;
