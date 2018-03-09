/**
 * @fileoverview Entry point for the application (client or SSR)
 */

import React from 'react';
import { Switch } from 'react-router-dom';
import { NotificationContainer, NotificationManager } from 'react-notifications';
import moment from 'moment-timezone';

import '../../node_modules/react-notifications/lib/notifications.css';
import '../../node_modules/react-datepicker/dist/react-datepicker.css';
import './assets/css/override.css';

import flashMessageStorage from './lib/flash-message-storage';

import { raw as rawRoutes, render as renderRoutes } from './routes';

class App extends React.Component {

  componentDidMount = () => {

    // flash any messages that are in the storage
    if (__CLIENT__) { // eslint-disable-line no-undef
      flashMessageStorage.getAll().forEach(({ level, message, timeOut }) => {
        NotificationManager[level](message, '', timeOut || 5000);
      });
    }
  }

  render = () => {

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

  }
}

export default App;
