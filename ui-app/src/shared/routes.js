/**
 * @fileoverview Routes for the application
 */

import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import _flow from 'lodash/fp/flow';
import _map from 'lodash/fp/map';

import DashboardPage from './pages/dashboard';
import LoginPage from './pages/login';
import AdminPage from './pages/admin';
import ManageSubscriptionPage from './pages/manage-subscription';

import AdminDashboardPage from './pages/admin/dashboard';
import ComponentsPage from './pages/admin/components';
import IncidentsPage from './pages/admin/incidents';
import SubscriptionsPage from './pages/admin/subscriptions';
import { apiGateway } from '../shared/lib/ajax-actions';

const _filter = require('lodash/fp/filter').convert({ cap: false });

/**
 * Initial loads for the routes.
 * @param {array} toLoad - what to load. options:
 *  components
 *  incidents
 *  subscriptions
 * @return {promise}
 *  on success, array
 */
const initialLoadData = (toLoad) => {

  const loads = {
    components: () => {
      return apiGateway.get('/components').then(res => {
        return {
          components: res.components || [],
          componentGroups: res.componentGroups || []
        };
      });
    },
    incidents: () => {
      return apiGateway.get('/incidents').then(res => {
        return {
          incidents: res
        };
      });
    },
    subscriptions: () => {
      return apiGateway.get('/subscriptions').then(res => {
        return {
          subscriptions: res
        };
      });
    }
  };

  const fnToLoad = _flow(
    _filter((fn, k) => {
      return toLoad.includes(k);
    }),
    _map(fn => {
      return fn();
    })
  )(loads);

  return Promise.all(fnToLoad).then(res => {
    return res.reduce((acc, val) => {
      return {...acc, ...val};
    }, {});
  });

};

// raw routes array
const raw = {
  routes: [
    {
      path: '/',
      component: DashboardPage,
      exact: true,
      initialLoad: () => {
        return initialLoadData(['components', 'incidents']);
      }
    },
    {
      path: '/login',
      component: LoginPage,
      exact: true
    },
    {
      path: '/manage_subscription/:subscriptionId',
      component: ManageSubscriptionPage,
      exact: true,
      initialLoad: () => {
        return initialLoadData(['subscriptions']);
      }
    },
    {
      path: '/admin',
      component: AdminPage,
      auth: true,
      routes: [
        {
          path: '/admin/dashboard',
          component: AdminDashboardPage,
          exact: true,
          title: 'Dashboard',
          iconCls: 'dashboard',
          initialLoad: () => {
            return initialLoadData(['components', 'incidents']);
          }
        },
        {
          path: '/admin/components',
          component: ComponentsPage,
          title: 'Components',
          iconCls: 'browser',
          initialLoad: () => {
            return initialLoadData(['components']);
          }
        },
        {
          path: '/admin/incidents',
          component: IncidentsPage,
          title: 'Incidents',
          iconCls: 'warning sign',
          initialLoad: () => {
            return initialLoadData(['components', 'incidents']);
          }
        },
        {
          path: '/admin/subscriptions',
          component: SubscriptionsPage,
          title: 'Subscriptions',
          iconCls: 'bell',
          initialLoad: () => {
            return initialLoadData(['subscriptions']);
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
