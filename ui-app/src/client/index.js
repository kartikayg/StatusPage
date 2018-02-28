/**
 * @fileoverview React starting point, with SSR supported
 */

import 'babel-polyfill';
import React from 'react';
import { hydrate } from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';

import ScrollToTop from './scroll-to-top';
import App from '../shared/app';
import { configure as configureStore } from '../shared/redux/store';

import auth from './auth';
import { apiGateway } from '../shared/lib/ajax-actions';

/* eslint-disable no-undef */

// Grab the state from a global variable injected into the server-generated HTML
let preloadedState = {};
if (typeof window !== 'undefined' && window.__PRELOADED_STATE__) {
  preloadedState = window.__PRELOADED_STATE__;
  delete window.__PRELOADED_STATE__;
}

// create the store
const store = configureStore(preloadedState);

// set auth token on api gateway, if present
if (__CLIENT__ === true && auth.token) { // eslint-disable-line no-undef
  apiGateway.setAuthToken(auth.token);
}

hydrate(
  (
    <Provider store={store}>
      <BrowserRouter>
        <ScrollToTop>
          <App />
        </ScrollToTop>
      </BrowserRouter>
    </Provider>
  ),
  document.getElementById('root')
);

/* eslint-enable no-undef */
