/**
 * @fileoverview Manages auth from client and server stand point of view. server is needed
 * to support SSR.
 */

/* eslint-disable no-undef */

/**
 * Client handler. Uses the local storage to store the auth token.
 */
const clientHandler = (function () {

  const tokenKey = 'authToken';

  return {
    setToken(token) {
      localStorage.setItem(tokenKey, token);
    },
    getToken() {
      localStorage.getItem(tokenKey);
    },
    logout() {
      localStorage.removeItem(tokenKey);
    }
  };

}());

/* eslint-enable no-undef */


/**
 * Server handler. Uses the cookie to store the auth token
 */
const serverHandler = (function () {

  const cookieName = 'authtoken';
  const opts = { httpOnly: true, sameSite: true };

  return {
    setToken(token, res) {
      res.cookie(cookieName, token, opts);
    },
    getToken(req) {
      return req.cookies[cookieName];
    },
    logout(res) {
      res.clearCookie(cookieName, opts);
    }
  };

}());


/**
 * Return the right handler based on whether its the client or the server
 * being executed.
 */
const getHandler = () => {

  if (__CLIENT__ === true) { // eslint-disable-line no-undef
    return clientHandler;
  }

  return serverHandler;

};

/**
 * Auth object
 */
const auth = {

  /**
   * Returns whether there is authenticated user set or not
   */
  isAuthenticated(...args) {
    const token = getHandler().getToken(...args);
    return token !== undefined && token !== null;
  },

  setToken(token, ...args) {
    getHandler().setToken(token, ...args);
  },

  getToken(...args) {
    return getHandler().getToken(...args);
  },

  logout(...args) {
    getHandler().logout(...args);
  }

};


export default auth;
