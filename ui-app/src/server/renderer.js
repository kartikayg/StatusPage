/**
 * @fileoverview Renders the app on the server side (SSR)
 */

import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import serialize from 'serialize-javascript';
import { Helmet } from 'react-helmet';

import App from '../shared/app';

/**
 * @param {object} req - express req object
 * @param {object} store - redux store
 * @param {object} context - react router context
 */
export default (req, store, context) => {

  // render the app as html
  const html = renderToString( // eslint-disable-line function-paren-newline
    <Provider store={store}>
      <StaticRouter location={req.path} context={context}>
        <App />
      </StaticRouter>
    </Provider>
  ); // eslint-disable-line function-paren-newline

  const helmet = Helmet.renderStatic();

  return `
    <!doctype html>
    <html>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <meta name="description" content="Status Page App">
        <meta name="language" content="en">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        ${helmet.title.toString()}
        ${helmet.meta.toString()}
        ${helmet.link.toString()}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/semantic-ui@2.3.1/dist/semantic.min.css"></link>
        <link rel="stylesheet" href="/public/app.styles.css"></link>
      </head>
      <body>
        <div id="root">${html}</div>
        <script>
          window.__PRELOADED_STATE__ = ${serialize(store.getState())}
        </script>
        <script type=text/javascript src="/public/vendor.bundle.js"></script>
        <script type=text/javascript src="/public/app.bundle.js"></script>
      </body>
    </html>
  `;

};
