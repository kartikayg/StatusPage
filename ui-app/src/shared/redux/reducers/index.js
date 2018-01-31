import { combineReducers } from 'redux';

import components from './components';
import componentGroups from './componentGroups';

// combine all reducers
export default combineReducers({
  components,
  componentGroups
});
