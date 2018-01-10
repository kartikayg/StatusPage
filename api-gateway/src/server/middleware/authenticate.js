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
    let message;

    const { token } = req;

    if (!token) {
      message = 'No authorization token passed in the header.';
    }
    else {
      user = await authRepo.verifyToken(token);
      if (user === false) {
        message = 'Invalid/Expired authorization token passed.';
      }
    }

    // not valid
    if (message) {
      res.status(httpStatus.Unauthorized).json({ message });
    }
    else {
      req.user = user;
      next();
    }

  };

};
