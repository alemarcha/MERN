import { combineReducers } from "redux";

import { authentication } from "./authentication.reducer";
import { users } from "./users.reducer";
import { alert } from "./alert.reducer";
import { helloFunc } from "hellolibalemarcha";
import { byeFunc } from "hellolibalemarcha";

const rootReducer = combineReducers({
  authentication,
  users,
  alert,
  helloFunc,
  byeFunc
});

export default rootReducer;
