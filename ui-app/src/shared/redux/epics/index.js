import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/mapTo';

import { combineEpics } from 'redux-observable';

const pingEpic = action$ => {
  return action$.filter(action => {
    return action.type === 'PING';
  })
    .mapTo({ type: 'PONG' });
};

export default combineEpics(pingEpic);
