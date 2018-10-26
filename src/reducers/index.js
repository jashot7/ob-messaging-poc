// import chat from './chat';
import modals from './modals';
import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import user from './user';
import webrelay from './webrelay';

const config = {
  id: 1
};

const rootReducer = combineReducers({
  config: () => config,
  router: routerReducer,
  modals,
  user,
  webrelay
});

export default rootReducer;
