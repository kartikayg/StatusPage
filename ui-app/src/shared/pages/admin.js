/**
 * @fileoverview Admin page.
 */

import React from 'react';
import { Switch, Redirect } from 'react-router-dom';
import { matchRoutes } from 'react-router-config';
import PropTypes from 'prop-types';
import Transition from 'react-transition-group/Transition';

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
    location.href = '/logout';
  }

  // on sidebar toggle from topbar
  onSidebarToggle = () => {
    this.setState(prevState => {
      return {
        sidebarActive: !prevState.sidebarActive
      }
    });
  }

  componentDidMount() {

    // add handling for resizing of window and mobile

    const { body } = document;
    const WIDTH = 768;
    const RATIO = 3;

    const handler = () => {
      if (!document.hidden) {
        let rect = body.getBoundingClientRect();
        let isMobile = rect.width - RATIO < WIDTH;

        this.setState({ 
          sidebarActive: !isMobile,
          isMobile
        });

      }
    };

    document.addEventListener('visibilitychange', handler);
    window.addEventListener('DOMContentLoaded', handler);
    window.addEventListener('resize', handler);

  }

  render() {

    const r = matchRoutes(rawRoutes.routes, this.props.match.path);

    // sidebar styles. use transform css property to show/hide
    const sidebarStyle = {
      transition: `transform 300ms ease-in`,
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
      marginLeft: !this.state.isMobile ? '200' : 0
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
              <Switch>
                {renderRoutes(r[0].route.routes, r[0].route.redirects)}
                <Redirect exact key={`REDIRECT_${Math.random()}`} from={this.props.match.url} to='/admin/dashboard' />
              </Switch>
            </div>
          </div>
        </div>
      </div>
    );
  }

}

export default AdminPage;
