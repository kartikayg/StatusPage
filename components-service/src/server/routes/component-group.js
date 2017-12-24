/**
 * @fileoverview  Component group routes
 */

import express from 'express';
import boolean from 'boolean';
import httpStatus from 'http-status';

import {params as sanitizeParams} from '../middleware/sanitize';

/**
 * Export the routes
 * @param {object} componentGroupRepo - component group repo
 * @return {object} router
 */
export default (componentGroupRepo) => {

  // express router
  const router = express.Router();

  // set variables in req object based on the componentGroup id in the
  // url. the param() doesn't accept multiple route parameters, so some
  // funky code is done to get around it.
  router.param('componentGroupId', (req, res, next) => {

    const load = () => {
      const { componentGroupId } = req.sanitizedParams;
      componentGroupRepo.load(componentGroupId).then(o => {
        req.componentGroupObj = o;
        next();
      }).catch(next);
    };

    sanitizeParams()(req, res, load);

  });


  // build routes
  router.route('/')

    /** GET /api/component_groups - list of component groups */
    .get((req, res, next) => {

      const query = Object.assign({}, req.sanitizedQuery);

      if (query.active !== undefined) {
        query.active = boolean(query.active);
      }

      componentGroupRepo.list(query).then(groups => {
        res.json(groups);
      }).catch(next);

    })

    /** POST /api/component_groups - creates a component group */
    .post((req, res, next) => {

      const data = req.sanitizedBody.componentgroup;

      // not a valid component group object sent
      if (!data || typeof data !== 'object') {
        res.status(httpStatus.UNPROCESSABLE_ENTITY).json({ message: 'No component group data sent in this request.' });
      }
      else {
        componentGroupRepo.create(data).then(group => {
          res.json(group);
        }).catch(next);
      }

    });

  router.route('/:componentGroupId')

    /** GET /api/component_groups/:componentGroupId - Gets a component group */
    .get((req, res, next) => {
      res.json(req.componentGroupObj);
    })

    /** PATCH /api/component_groups/:componentGroupId - Updates properties of a component group */
    .patch((req, res, next) => {

      const groupId = req.sanitizedParams.componentGroupId;
      const data = req.sanitizedBody.componentgroup;

      // not a valid component group object sent
      if (!data || typeof data !== 'object') {
        res.status(httpStatus.UNPROCESSABLE_ENTITY).json({ message: 'No component group data sent in this request.' });
      }
      else {
        componentGroupRepo.update(req.componentGroupObj, data).then(group => {
          res.json(group);
        }).catch(next);
      }

    })

    /** DELETE /api/component_groups/:componentGroupId - Deletes a component group */
    .delete((req, res, next) => {
      componentGroupRepo.remove(req.componentGroupObj).then(() => {
        res.json({ message: 'Component Group deleted'});
      }).catch(next);
    });

  return router;

};
