/**
 * @fileoverview
 */

import { createStore, applyMiddleware } from 'redux';
import { createEpicMiddleware } from 'redux-observable';
import { createLogger } from 'redux-logger';

import epics from './epics';
import reducers from './reducers';

const epicMiddleware = createEpicMiddleware(epics);

/**
 *
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
