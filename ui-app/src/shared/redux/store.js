/**
 * @fileoverview Redux store configuration
 */

import { createStore, applyMiddleware } from 'redux';
import { createEpicMiddleware } from 'redux-observable';
import { createLogger } from 'redux-logger';

import epics from './epics';
import reducers from './reducers';

const epicMiddleware = createEpicMiddleware(epics);

/**
 * Configures a redux store based on an initial state
 * @param {object} initialState
 * @return {object}
 */
const configure = (initialState) => {

  const store = createStore(
    reducers,
    initialState,
    applyMiddleware(epicMiddleware, createLogger())
  );

  return store;

};

export { configure };
