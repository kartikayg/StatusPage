/**
 * @fileoverview Routes for components service
 */

import express from 'express';

export default (componentRepo) => {

  const router = express.Router(); // eslint-disable-line new-cap

  router.route('/components')

    .get((req, res, next) => {
      componentRepo.get().then(components => {
        return res.json(components);
      }).catch(next);
    })

    .post((req, res, next) => {
      componentRepo.create(req.body.component).then(component => {
        res.json(component);
      }).catch(next);
    });

  return router;

};
