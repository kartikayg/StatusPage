/**
 * @fileoverview  Component routes
 */

import express from 'express';
import boolean from 'boolean';
import httpStatus from 'http-status';

import {params as sanitizeParams} from '../middleware/sanitize';

/**
 * Export the routes
 * @param {object} componentRepo - component repo
 * @return {object} router
 */
export default (componentRepo) => {

  // express router
  const router = express.Router();

  // set variables in req object based on the component id in the
  // url. the param() doesn't accept multiple route parameters, so some
  // funky code is done to get around it.
  router.param('componentId', (req, res, next) => {

    const load = () => {
      const { componentId } = req.sanitizedParams;
      componentRepo.load(componentId).then(o => {
        req.componentObj = o;
        next();
      }).catch(next);
    };

    sanitizeParams()(req, res, load);

  });

  // build routes
  router.route('/')

    /** GET /api/components - list of components */
    .get((req, res, next) => {

      const query = Object.assign({}, req.sanitizedQuery);

      if (query.active !== undefined) {
        query.active = boolean(query.active);
      }

      componentRepo.list(query).then(components => {
        res.json(components);
      }).catch(next);

    })

    /** POST /api/components - creates a component */
    .post((req, res, next) => {

      const data = req.sanitizedBody.component;

      if (!data || typeof data !== 'object') {
        res.status(httpStatus.UNPROCESSABLE_ENTITY).json({ message: 'No component data sent in this request.' });
      }
      else {
        componentRepo.create(data).then(component => {
          res.json(component);
        }).catch(next);
      }

    });

  router.route('/:componentId')

    /** GET /api/components/:componentId - Get component */
    .get((req, res, next) => {
      res.json(req.componentObj);
    })

    /** PATCH /api/components/:componentId - Update properties of a component */
    .patch((req, res, next) => {

      const data = req.sanitizedBody.component;

      // not a valid component object sent
      if (!data || typeof data !== 'object') {
        res.status(httpStatus.UNPROCESSABLE_ENTITY).json({ message: 'No component data sent in this request.' });
      }
      else {
        componentRepo.update(req.componentObj, data).then(component => {
          res.json(component);
        }).catch(next);
      }

    })

    /** DELETE /api/components/:componentId - Delete component */
    .delete((req, res, next) => {
      componentRepo.remove(req.componentObj).then(() => {
        res.json({ message: 'Component deleted'});
      }).catch(next);
    });

  return router;

};
