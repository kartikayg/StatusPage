/**
 * @fileoverview React starting point, with SSR supported
 */

import 'babel-polyfill';
import React from 'react';
import { hydrate } from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';

import App from '../shared/app';
import { configure as configureStore } from '../shared/redux/store';

/* eslint-disable no-undef */

// Grab the state from a global variable injected into the server-generated HTML
let preloadedState = {};
if (typeof window !== 'undefined' && window.__PRELOADED_STATE__) {
  preloadedState = window.__PRELOADED_STATE__;
  delete window.__PRELOADED_STATE__;
}

// create the store
const store = configureStore(preloadedState);

hydrate(
  (
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  ),
  document.getElementById('root')
);

/* eslint-enable no-undef */
