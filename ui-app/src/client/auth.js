/**
 * @fileoverview Manages auth token from client stand point of view
 */

/* eslint-disable no-undef */

const tokenKey = 'authToken';

export default {
  set token(token) {
    localStorage.setItem(tokenKey, token);
  },
  get token() {
    return localStorage.getItem(tokenKey);
  },
  logout() {
    localStorage.removeItem(tokenKey);
  }
};

/* eslint-enable no-undef */
