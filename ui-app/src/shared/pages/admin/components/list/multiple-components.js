/**
 * @fileoverview Render a group with all the components in it.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { SortableElement } from 'react-sortable-hoc';

import { StatusIcon } from '../../../../presentation/component-status';

const MultipleComponents = SortableElement(({ group }) => {
  return (
    <div className="item">
      <table className="ui large very basic table">
        <tbody>
          <tr>
            <td colSpan="3">
              <div className="ui ribbon label large" style={{ left: 0 }}>{group.group_name}</div>
            </td>
          </tr>
          {group.components.map((c, idx) => {
            return (
              <tr key={c.id}>
                <td style={{ borderTop: 0 }}>&nbsp;</td>
                <td style={idx === 0 ? { borderTop: 0 } : {}}>
                  <StatusIcon status={c.status} /> {c.name} {!c.active ? '(Inactive)' : ''}
                </td>
                <td className="right aligned" style={idx === 0 ? { borderTop: 0 } : {}}>
                  <Link to={`/admin/components/edit/${c.id}`} className="ui button">Edit</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

MultipleComponents.propTypes = {
  group: PropTypes.object.isRequired
};

export default MultipleComponents;
