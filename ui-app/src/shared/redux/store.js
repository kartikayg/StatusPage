/**
 * @fileoverview Redux store configuration
 */

import { createStore, applyMiddleware, compose } from 'redux';
import { createEpicMiddleware } from 'redux-observable';
import { createLogger } from 'redux-logger';

import epics from './epics';
import reducers from './reducers';

const epicMiddleware = createEpicMiddleware(epics);

/* eslint-disable no-undef */
/* eslint-disable function-paren-newline */

/**
 * Configures a redux store based on an initial state
 * @param {object} initialState
 * @return {object}
 */
const configure = (initialState) => {

  // has devtools
  const hasDevtools = process.env.NODE_ENV === 'development' && Boolean(
    typeof window !== 'undefined' &&
    (window).__REDUX_DEVTOOLS_EXTENSION__ &&
    (window).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__,
  );

  let enhancer;

  if (hasDevtools) {
    enhancer = (window).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__(
      compose(applyMiddleware(epicMiddleware, createLogger())),
    );
  }
  else {
    enhancer = compose(applyMiddleware(epicMiddleware, createLogger()));
  }

  const store = createStore(reducers, initialState, enhancer);
  return store;

};

export { configure };

/* eslint-enable no-undef */
/* eslint-enable function-paren-newline */
