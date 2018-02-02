/**
 * @fileoverview Auth middleware
 */

import httpStatus from 'http-status';

/**
 * Function to authenticate the request based on JSON web token
 * @param {object} authRepo
 * @return {function}
 */
export default (authRepo) => {

  return async (req, res, next) => {

    let user;
    let errMessage;

    const rawToken = req.get('Authorization');

    if (!rawToken) {
      errMessage = 'No authorization token passed in the header.';
    }
    else {
      const parts = rawToken.split(' ');
      if (parts.length !== 2) {
        errMessage = 'Invalid authorization token passed.';
      }
      else {
        const scheme = parts[0];
        const credentials = parts[1];

        if (/^JWT$/i.test(scheme)) {
          user = await authRepo.verifyToken(credentials);
          if (user === false) {
            errMessage = 'Invalid authorization token passed';
          }
        }
        else {
          errMessage = 'Invalid authorization token passed.';
        }
      }
    }

    // not valid
    if (errMessage) {
      res.status(httpStatus.UNAUTHORIZED).json({ message: errMessage });
    }
    else {
      req.user = user;
      next();
    }

  };

};
