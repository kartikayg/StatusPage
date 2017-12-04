/**
 * @fileoverview  Incident routes
 */

import express from 'express';
import boolean from 'boolean';
import httpStatus from 'http-status';

import {params as sanitizeParams} from '../middleware/sanitize';

/**
 * Export the routes
 * @param {object} repo - incidents repo
 * @return {object} router
 */
export default (repo) => {

  if (repo.name !== 'incidents') {
    throw new Error(`Invalid repo passed to this router. Passed repo name: ${repo.name}`);
  }


  // express router
  const router = express.Router();

  // build routes
  router.route('/')

    /** GET /api/incidents - list of incidents */
    .get((req, res, next) => {
      repo.list(req.sanitizedQuery).then(incidents => {
        res.json(incidents);
      }).catch(next);
    })

    /** POST /api/incidents - creates an incident */
    .post((req, res, next) => {

      const data = req.sanitizedBody.incident;

      // not a valid incident object sent
      if (!data || typeof data !== 'object') {
        res.status(httpStatus.UNPROCESSABLE_ENTITY).json({ message: 'No incident data sent in this request.' });
      }
      else {

        // if message passed, keep the original. it could contain some html chars which will
        // be sanitized later.
        if (data.message) {
          data.message = req.body.incident.message;
        }

        repo.create(data).then(newIncident => {
          res.json(newIncident);
        }).catch(next);
      }

    });

  router.route('/:incidentId')

    // sanitize the params
    .all(sanitizeParams())

    /** GET /api/incidents/:incidentId - Gets an incident */
    .get((req, res, next) => {
      repo.load(req.sanitizedParams.incidentId).then(incidentObj => {
        res.json(incidentObj);
      }).catch(next);
    })

    /** PATCH /api/incidents/:incidentId - Updates an incident */
    .patch((req, res, next) => {

      const { incidentId } = req.sanitizedParams;
      const data = req.sanitizedBody.incident;

      // not a valid incident object sent
      if (!data || typeof data !== 'object') {
        res.status(httpStatus.UNPROCESSABLE_ENTITY).json({ message: 'No incident data sent in this request.' });
      }
      else {

        // if message passed, keep the original. it could contain some html chars which will
        // be sanitized later.
        if (data.message) {
          data.message = req.body.incident.message;
        }

        repo.update(incidentId, data).then(updIncident => {
          res.json(updIncident);
        }).catch(next);

      }

    })

    /** DELETE /api/incidents/:incidentId - Deletes an incident */
    .delete((req, res, next) => {
      repo.remove(req.sanitizedParams.incidentId).then(() => {
        res.json({ message: 'Incident deleted'});
      }).catch(next);
    });


  router.route('/:incidentId/incident_updates/:incidentUpdateId')

    // sanitize the params
    .all(sanitizeParams())

    /** PATCH - Updates incident-update */
    .patch((req, res, next) => {

      const { incidentId, incidentUpdateId } = req.sanitizedParams;
      const data = req.sanitizedBody.update;

      // not a valid incident object sent
      if (!data || typeof data !== 'object') {
        res.status(httpStatus.UNPROCESSABLE_ENTITY).json({ message: 'No update data sent in this request.' });
      }
      else {

        // if message passed, keep the original. it could contain some html chars which will
        // be sanitized later.
        if (data.message) {
          data.message = req.body.update.message;
        }

        repo.changeIncidentUpdateEntry(incidentId, incidentUpdateId, data).then(updIncident => {
          res.json(updIncident);
        }).catch(next);

      }

    });


  return router;

};
