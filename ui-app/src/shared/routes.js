/**
 * @fileoverview Routes for the application
 */

import React from 'react';
import { Route, Redirect } from 'react-router-dom';

import DashboardPage from './pages/dashboard';
import LoginPage from './pages/login';
import AdminPage from './pages/admin';

import ComponentsPage from './pages/admin/components';
import { apiGateway } from '../shared/lib/ajax-actions';

// raw routes array
const raw = {
  routes: [
    {
      path: '/',
      component: DashboardPage,
      exact: true
    },
    {
      path: '/login',
      component: LoginPage,
      exact: true
    },
    {
      path: '/admin',
      component: AdminPage,
      auth: true,
      routes: [
        {
          path: '/admin/dashboard',
          component: ComponentsPage,
          exact: true,
          title: 'Dashboard',
          iconCls: 'dashboard'
        },
        {
          path: '/admin/components',
          component: ComponentsPage,
          title: 'Components',
          iconCls: 'browser',
          initialLoad: () => {
            return apiGateway.get('/components').then(resp => {
              return resp;
            });
          }
        }
      ],
      redirects: [
        {
          from: '/admin/*',
          to: '/admin/dashboard',
          exact: true,
          status: 302
        }
      ]
    }
  ],
  redirects: [
    {
      from: '*',
      to: '/',
      status: 302,
      exact: true
    }
  ]
};

// a private route to use for authenticated routes
const RedirectWithStatus = ({ from, to, status }) => { // eslint-disable-line react/prop-types
  return <Route render={({ staticContext }) => {
    // there is no `staticContext` on the client, so
    // we need to guard against that here
    if (staticContext) {
      staticContext.status = status; // eslint-disable-line no-param-reassign
    }
    return <Redirect key={`REDIRECT_${Math.random()}`} from={from} to={to} />;
  }} />;
};


/**
 * Renders the routes and redirect tags
 * @param {object} routes
 * @param {object} redirects
 */
const render = (routes, redirects = []) => {

  // render routes
  const r = routes.map(({ exact, path, component }) => {
    return <Route key={`ROUTE_${Math.random()}`} exact={exact} path={path} component={component} />;
  });

  // render redirects
  const rd = redirects.map(({ from, to, status }) => {
    return <RedirectWithStatus key={`REDIRECT_WITH_STATUS_${Math.random()}`} from={from} to={to} status={status} />;
  });

  return [...r, ...rd];

};

export { raw, render };
