/**
 * @fileoverview  Component group routes
 */

import express from 'express';
import boolean from 'boolean';
import httpStatus from 'http-status';

import {params as sanitizeParams} from '../middleware/sanitize';

/**
 * Export the routes
 * @param {object} repo - component group repo
 * @return {object} router
 */
export default (repo) => {

  if (repo.name !== 'component_groups') {
    throw new Error(`Invalid repo passed to this router. Passed repo name: ${repo.name}`);
  }


  // express router
  const router = express.Router();

  // build routes
  router.route('/')

    /** GET /api/component_groups - list of component groups */
    .get((req, res, next) => {

      const query = Object.assign({}, req.sanitizedQuery);

      if (query.active !== undefined) {
        query.active = boolean(query.active);
      }

      repo.list(query).then(groups => {
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
        repo.create(data).then(group => {
          res.json(group);
        }).catch(next);
      }

    });

  router.route('/:componentGroupId')

    // sanitize the params
    .all(sanitizeParams())

    /** GET /api/component_groups/:componentGroupId - Gets a component group */
    .get((req, res, next) => {
      repo.load(req.sanitizedParams.componentGroupId).then(group => {
        res.json(group);
      }).catch(next);
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
        repo.update(groupId, data).then(group => {
          res.json(group);
        }).catch(next);
      }

    })

    /** DELETE /api/component_groups/:componentGroupId - Deletes a component group */
    .delete((req, res, next) => {
      repo.remove(req.sanitizedParams.componentGroupId).then(() => {
        res.json({ message: 'Component Group deleted'});
      }).catch(next);
    });

  return router;

};
