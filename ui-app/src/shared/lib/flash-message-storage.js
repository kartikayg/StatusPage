/**
 * @fileoverview Storage for messages to flash on the next page reload
 */

import Cookies from 'universal-cookie';

const key = 'flashMessage';
let _cookies;

const storage = {

  add(level, message) {
    const msgs = _cookies.get(key) || [];
    msgs.push({ level, message });
    _cookies.set(key, msgs);
  },

  getAll() {
    const msgs = _cookies.get(key) || [];
    _cookies.set(key, []);
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
