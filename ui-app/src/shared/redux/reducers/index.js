import { combineReducers } from 'redux';

import components from './components';
import componentGroups from './componentGroups';
import incidents from './incidents';
import subscriptions from './subscriptions';

// combine all reducers
export default combineReducers({
  components,
  componentGroups,
  incidents,
  subscriptions
});
