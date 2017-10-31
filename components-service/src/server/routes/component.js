/**
 * @fileoverview Return component routes
 */

import express from 'express';
import boolean from 'boolean';

import {params as sanitizeParams} from '../middleware/sanitize';

export default (repo) => {

  if (repo.name !== 'components') {
    throw new Error(`Invalid repo passed to this router. Passed repo name: ${repo.name}`);
  }

  /**
   *
   */
  const format = (components) => {

    const fmt = (c) => {
      const cmp = Object.assign({}, c);
      delete cmp._id;
      return cmp;
    };

    if (Array.isArray(components)) {
      return components.map(fmt);
    }

    return fmt(components);

  };

  // 
  const router = express.Router();

  // build routes
  router.route('/')

    // GET - Get list of components
    .get((req, res, next) => {

      const query = Object.assign({}, req.sanitizedQuery);

      if (query.active !== undefined) {
        query.active = boolean(query.active);
      }

      repo.list(query).then(components => {
        res.json(format(components));
      }).catch(next);

    })

    // POST - Creates a new component
    .post((req, res, next) => {
      repo.create(req.sanitizedBody.component).then(component => {
        res.json(component);
      }).catch(next);
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
      const data = req.sanitizedBody.component || {};

      repo.update(cmpId, data).then(component => {
        res.json(component);
      }).catch(next);

    })

    /** PATCH /api/components/:componentId - Update one or more properties of a component */
    .patch((req, res, next) => {

      const cmpId = req.sanitizedParams.componentId;
      const data = req.sanitizedBody.component || {};

      repo.partialUpdate(cmpId, data).then(component => {
        res.json(component);
      }).catch(next);

    })

    /** DELETE /api/components/:componentId - Delete component */
    .delete((req, res, next) => {
      repo.remove(req.sanitizedParams.componentId).then(() => {
        res.json({ message: 'Component deleted'});
      }).catch(next);
    });

  return router;

};
