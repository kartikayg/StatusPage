/**
 * @fileoverview Sidebar section for admin
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

// sidebar item
const Item = ({ route, isActive }) => {
  return (
    <a className={classNames('item', { active: isActive })} href={route.path}>
      <i className={`${route.iconCls} icon`}></i> {route.title}
    </a>
  );
};

Item.propTypes = {
  route: PropTypes.object.isRequired,
  isActive: PropTypes.bool.isRequired
};

// sidebar
const Sidebar = ({ currentLocation, menu }) => {

  return (
    <div
      className="ui inverted labeled icon left inline vertical demo sidebar menu uncover visible"
      style={{ width: 200 }}
    >
      {menu.map(m => {
        return <Item route={m} key={m.title} isActive={currentLocation.pathname === m.path} />;
      })}
    </div>
  );
};

Sidebar.propTypes = {
  currentLocation: PropTypes.object.isRequired,
  menu: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default Sidebar;
