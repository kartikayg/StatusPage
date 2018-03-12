/**
 * @fileoverview Routes for components service
 */

import express from 'express';

export default (componentRepo, authMiddleware) => {

  const router = express.Router(); // eslint-disable-line new-cap

  router.route('/components')

    // get all components
    .get((req, res, next) => {
      componentRepo.get().then(resp => {
        return res.json(resp);
      }).catch(next);
    })

    // create a new component
    .post(authMiddleware, (req, res, next) => {
      componentRepo.create(req.body.component).then(component => {
        res.json(component);
      }).catch(next);
    });

  router.route('/components/:componentId')

    // updates a component
    .patch(authMiddleware, (req, res, next) => {
      componentRepo.update(req.params.componentId, req.body.component).then(component => {
        res.json(component);
      }).catch(next);
    });

  router.route('/component_groups')

    // create a new component group
    .post(authMiddleware, (req, res, next) => {
      componentRepo.createGroup(req.body.name).then(group => {
        res.json(group);
      }).catch(next);
    });

  return router;

};
