/**
 * @fileoverview Entry point for the application (client or SSR)
 */

import React from 'react';
import { Switch } from 'react-router-dom';
import { NotificationContainer } from 'react-notifications';
import moment from 'moment-timezone';

import '../../node_modules/react-notifications/lib/notifications.css';
import '../../node_modules/react-datepicker/dist/react-datepicker.css';
import './assets/css/override.css';

import { raw as rawRoutes, render as renderRoutes } from './routes';

const app = () => {

  // set default timezone
  moment.tz.setDefault(process.env.ORG_TIMEZONE);

  return (
    <div>
      <Switch>
        {renderRoutes(rawRoutes.routes, rawRoutes.redirects)}
      </Switch>
      <NotificationContainer />
    </div>
  );
};

export default app;
