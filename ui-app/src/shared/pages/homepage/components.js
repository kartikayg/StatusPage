/**
 * @fileoverview Components block for the homepage. Displays components and their
 * status.
 */

import React from 'react';
import PropTypes from 'prop-types';

import { StatusIconWithText } from '../../presentation/component-status';

/**
 * Single component render
 * @prop {object} component
 */
const SingleComponent = ({ component }) => {
  return (
    <div className="item">
      <table className="ui very basic table">
        <tbody>
          <tr>
            <td style={{ fontWeight: 'bold' }}>{component.name}</td>
            <td className="right aligned five wide">
              <StatusIconWithText status={component.status} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

SingleComponent.propTypes = {
  component: PropTypes.object.isRequired
};

/**
 * Multiple components (under a group) to render.
 * @prop {object} group
 */
const MultipleComponents = ({ group }) => {
  return (
    <div className="item">
      <table className="ui very basic table">
        <tbody>
          <tr>
            <td colSpan="3">
              <div className="ui ribbon large label" style={{ left: 0 }}>
                {group.group_name}
              </div>
            </td>
          </tr>
          {group.components.map((c, idx) => {
            return (
              <tr key={c.id}>
                <td style={{ borderTop: 0 }} className="one wide">&nbsp;</td>
                <td style={idx === 0 ? { borderTop: 0, fontWeight: 'bold' } : { fontWeight: 'bold' }}>
                  {c.name}
                </td>
                <td className="right aligned five wide" style={idx === 0 ? { borderTop: 0 } : {}}>
                  <StatusIconWithText status={c.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

MultipleComponents.propTypes = {
  group: PropTypes.object.isRequired
};


/**
 * Components block
 * @prop {array} componentsByGroup
 */
const ComponentsBlock = ({ componentsByGroup }) => {

  let body;

  if (componentsByGroup.length === 0) {
    body = (
      <div>
        <p><strong>No components found</strong></p>
      </div>
    );
  }
  else {
    body = (
      <div className="ui divided list">
        {componentsByGroup.map((cg, idx) => {
          if (cg.group_id) {
            return <MultipleComponents key={cg.group_id} index={idx} group={cg} />;
          }
          return <SingleComponent key={cg.components[0].id} index={idx} component={cg.components[0]} />; // eslint-disable-line max-len
        })}
      </div>
    );
  }

  return body;

};

ComponentsBlock.propTypes = {
  componentsByGroup: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default ComponentsBlock;
