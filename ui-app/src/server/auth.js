/**
 * @fileoverview Authentication handler for SSR. Uses cookie for now.
 */

const cookieName = 'authtoken';
const cookieOpts = { httpOnly: true, sameSite: true };

const init = (req, res) => {
  return {
    set token(token) {
      res.cookie(cookieName, token, cookieOpts);
    },
    get token() {
      return req.cookies[cookieName];
    },
    logout() {
      res.clearCookie(cookieName, cookieOpts);
    },
    isAuthenticated() {
      return this.token !== undefined;
    }
  };
};

export default {
  init
};
