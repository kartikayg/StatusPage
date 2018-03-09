/**
 * @fileoverview Storage for messages to flash on the next page reload
 * Uses cookies to store the messages
 */

import Cookies from 'universal-cookie';

const key = 'flashMessage';

// initialize it differently later based on if its SERVER or CLIENT
let _cookies;

const opts = { path: '/' };

const storage = {

  add(level, message, timeOut = 5000) {
    const msgs = _cookies.get(key) || [];
    msgs.push({ level, message, timeOut });
    _cookies.set(key, msgs, opts);
  },

  getAll() {
    const msgs = _cookies.get(key) || [];
    _cookies.set(key, [], opts);
    return msgs;
  }

};

export default storage;

// for the server side, the cookie is initialized using the
// express req object and passed here.
if (__SERVER__) { // eslint-disable-line no-undef
  exports.initCookies = (c) => {
    _cookies = c;
  };
}
else if (__CLIENT__) { // eslint-disable-line no-undef
  _cookies = new Cookies();
}
