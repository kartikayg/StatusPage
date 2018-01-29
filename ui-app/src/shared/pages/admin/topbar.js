/**
 * @fileoverview Topbar for admin section
 */

import React from 'react';
import PropTypes from 'prop-types';

// topbar element
const Topbar = ({ onLogoutClick, onSidebarToggle, showSidebarToggle }) => {
  return (
    <div className="ui top attached demo menu" style={{ minHeight: 50 }}>

      {showSidebarToggle &&
        <a className="toc item">
          <i className="sidebar icon" onClick={onSidebarToggle}></i>
        </a>
      }

      <div className="right item">
        <a className="ui button" onClick={onLogoutClick}>Logout</a>
      </div>

    </div>
  );
};

Topbar.propTypes = {
  onLogoutClick: PropTypes.func.isRequired,
  onSidebarToggle: PropTypes.func.isRequired,
  showSidebarToggle: PropTypes.bool.isRequired
};

export default Topbar;
