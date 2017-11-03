/**
 * @fileoverview  Component routes
 */

import express from 'express';
import boolean from 'boolean';
import httpStatus from 'http-status';

import {params as sanitizeParams} from '../middleware/sanitize';

/**
 * Export the routes
 * @param {object} repo - component repo
 * @return {object} router
 */
export default (repo) => {

  if (repo.name !== 'components') {
    throw new Error(`Invalid repo passed to this router. Passed repo name: ${repo.name}`);
  }


  // express router
  const router = express.Router();

  // build routes
  router.route('/')

    /** GET /api/components - list of components */
    .get((req, res, next) => {

      const query = Object.assign({}, req.sanitizedQuery);

      if (query.active !== undefined) {
        query.active = boolean(query.active);
      }

      repo.list(query).then(components => {
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
        repo.create(data).then(component => {
          res.json(component);
        }).catch(next);
      }

    });

  router.route('/:componentId')

    // sanitize the params
    .all(sanitizeParams())

    /** GET /api/components/:componentId - Get component */
    .get((req, res, next) => {
      repo.load(req.sanitizedParams.componentId).then(component => {
        res.json(component);
      }).catch(next);
    })

    /** PUT /api/components/:componentId - Update component */
    .put((req, res, next) => {

      const cmpId = req.sanitizedParams.componentId;
      const data = req.sanitizedBody.component;

      // not a valid component object sent
      if (!data || typeof data !== 'object') {
        res.status(httpStatus.UNPROCESSABLE_ENTITY).json({ message: 'No component data sent in this request.' });
      }
      else {
        repo.update(cmpId, data).then(component => {
          res.json(component);
        }).catch(next);
      }

    })

    /** PATCH /api/components/:componentId - Update one or more properties of a component */
    .patch((req, res, next) => {

      const cmpId = req.sanitizedParams.componentId;
      const data = req.sanitizedBody.component;

      // not a valid component object sent
      if (!data || typeof data !== 'object') {
        res.status(httpStatus.UNPROCESSABLE_ENTITY).json({ message: 'No component data sent in this request.' });
      }
      else {
        repo.partialUpdate(cmpId, data).then(component => {
          res.json(component);
        }).catch(next);
      }

    })

    /** DELETE /api/components/:componentId - Delete component */
    .delete((req, res, next) => {
      repo.remove(req.sanitizedParams.componentId).then(() => {
        res.json({ message: 'Component deleted'});
      }).catch(next);
    });

  return router;

};
