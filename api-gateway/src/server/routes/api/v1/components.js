/**
 * @fileoverview Routes for components service
 */

import express from 'express';

export default (componentRepo) => {

  const router = express.Router(); // eslint-disable-line new-cap

  router.route('/components')

    .get((req, res, next) => {
      componentRepo.get().then(resp => {
        return res.json(resp);
      }).catch(next);
    })

    .post((req, res, next) => {
      componentRepo.create(req.body.component).then(component => {
        res.json(component);
      }).catch(next);
    });

  router.route('/components/:componentId')

    /** Update properties of a component */
    .patch((req, res, next) => {
      componentRepo.update(req.params.componentId, req.body.component).then(component => {
        res.json(component);
      }).catch(next);
    });

  return router;

};
