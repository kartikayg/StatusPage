/**
 * @fileoverview
 */
import React from 'react';
import { Switch } from 'react-router-dom';

import { raw as rawRoutes, render as renderRoutes } from './routes';

const app = () => {
  return (
    <div>
      <Switch>
        {renderRoutes(rawRoutes.routes, rawRoutes.redirects)}
      </Switch>
    </div>
  );
};

export default app;
