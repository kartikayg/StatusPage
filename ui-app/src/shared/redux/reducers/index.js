import { combineReducers } from 'redux';

// reducers.js

const firstNamedReducer = (state = 1, action) => {
  return state;
};
const secondNamedReducer = (state = 2, action) => {
  return state;
};

export default combineReducers({
  firstNamedReducer,
  secondNamedReducer
});
