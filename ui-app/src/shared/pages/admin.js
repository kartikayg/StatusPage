/**
 * @fileoverview Admin page.
 */

import React from 'react';
import { Switch, Redirect } from 'react-router-dom';
import { matchRoutes } from 'react-router-config';
import PropTypes from 'prop-types';

import Sidebar from './admin/sidebar';
import Topbar from './admin/topbar';

import { raw as rawRoutes, render as renderRoutes } from '../routes';
import auth from '../../client/auth';

class AdminPage extends React.Component {

  static propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
  }

  state = {
    // used to show/hide the sidebar.
    sidebarActive: true,
    isMobile: false
  }

  // on logout button click, logout from client and then server
  onLogoutClick = () => {
    auth.logout();
    location.href = '/logout'; // eslint-disable-line no-undef
  }

  // on sidebar toggle from topbar
  onSidebarToggle = () => {
    this.setState(prevState => {
      return {
        sidebarActive: !prevState.sidebarActive
      };
    });
  }

  componentDidMount() {

    /* eslint-disable no-undef */

    // add handling for resizing of window and mobile

    const { body } = document;
    const WIDTH = 768;
    const RATIO = 3;

    const handler = () => {
      if (!document.hidden) { // eslint-disable-line no-undef
        const rect = body.getBoundingClientRect();
        const isMobile = rect.width - RATIO < WIDTH;

        if (this.state.isMobile !== isMobile) {
          this.setState({
            sidebarActive: !isMobile,
            isMobile
          });
        }

      }
    };

    document.addEventListener('visibilitychange', handler);
    window.addEventListener('DOMContentLoaded', handler);
    window.addEventListener('resize', handler);

    /* eslint-enable no-undef */

  }

  render() {

    const r = matchRoutes(rawRoutes.routes, this.props.match.path);

    // sidebar styles. use transform css property to show/hide
    const sidebarStyle = {
      transition: 'transform 300ms ease-in',
      position: 'fixed',
      left: 0,
      height: '100%',
      zIndex: 1023
    };
    if (!this.state.sidebarActive) {
      sidebarStyle.transform = 'translateX(-200px)';
    }

    // main section style
    const routeStyle = {
      marginLeft: !this.state.isMobile ? '300' : '50',
      maxWidth: '68rem',
      marginTop: 25
    };

    return (
      <div>
        <Topbar
          onLogoutClick={this.onLogoutClick}
          onSidebarToggle={this.onSidebarToggle}
          showSidebarToggle={this.state.isMobile}
        />
        <div className="pusher">
          <div className="ui bottom attached segment pushable">
            <div style={sidebarStyle} >
              <Sidebar currentLocation={this.props.location} menu={r[0].route.routes}/>
            </div>
            <div className="ui basic segment" style={routeStyle}>
              <div style={{ marginLeft: 'auto', marginRight: 'auto' }}>
                <Switch>
                  {renderRoutes(r[0].route.routes, r[0].route.redirects)}
                  <Redirect
                    exact key={`REDIRECT_${Math.random()}`}
                    from={this.props.match.url}
                    to='/admin/dashboard'
                  />
                </Switch>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

}

export default AdminPage;
