/**
 * @fileoverview Admin page.
 */

import React from 'react';
import { Switch, Redirect } from 'react-router-dom';
import { matchRoutes } from 'react-router-config';

import { raw as rawRoutes, render as renderRoutes } from '../routes';

export default ({ match }) => { // eslint-disable-line react/prop-types

  const r = matchRoutes(rawRoutes.routes, match.path);

  return (
    <div>
      <h2>Admin page</h2>
        <Switch>
          {renderRoutes(r[0].route.routes, r[0].route.redirects)}
          <Redirect exact key={`REDIRECT_${Math.random()}`} from={match.url} to='/admin/components' />
        </Switch>
    </div>
  );
};
