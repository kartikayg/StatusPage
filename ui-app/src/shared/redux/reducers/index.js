import { combineReducers } from 'redux';

import components from './components';
import componentGroups from './componentGroups';
import incidents from './incidents';

// combine all reducers
export default combineReducers({
  components,
  componentGroups,
  incidents
});
