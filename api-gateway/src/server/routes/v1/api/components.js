/**
 * @fileoverview Routes for components service
 */

import express from 'express';

export default (repo) => {

  const router = express.Router(); // eslint-disable-line new-cap

  router.route('/components')

    .get((req, res, next) => {
      repo.get().then(components => {
        return res.json(components);
      }).catch(next);
    });

  return router;

};
