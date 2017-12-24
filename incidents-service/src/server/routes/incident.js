/**
 * @fileoverview  Incident routes
 */

import express from 'express';
import httpStatus from 'http-status';

import {params as sanitizeParams} from '../middleware/sanitize';

/**
 * Export the routes
 * @param {object} repo - incidents repo
 * @return {object} router
 */
export default (incidentRepo) => {

  // express router
  const router = express.Router();

  // set variables in req object based on the subscription id in the
  // url. the param() doesn't accept multiple route parameters, so some
  // funky code is done to get around it.
  router.param('incidentId', (req, res, next) => {

    const load = () => {
      const { incidentId } = req.sanitizedParams;
      incidentRepo.load(incidentId).then(o => {
        req.incidentObj = o;
        incidentRepo.ofType(o.type).then(t => {
          req.repo = t;
          next();
        });
      }).catch(next);
    };

    sanitizeParams()(req, res, load);

  });

  // build routes
  router.route('/')

    /** GET /api/incidents - list of incidents */
    .get((req, res, next) => {
      incidentRepo.list(req.sanitizedQuery).then(incidents => {
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

        incidentRepo.ofType(data.type).then(repo => {
          return repo.create(data);
        }).then(newIncident => {
          res.json(newIncident);
        }).catch(next);

      }

    });

  router.route('/:incidentId')

    /** GET /api/incidents/:incidentId - Gets an incident */
    .get((req, res, next) => {
      res.json(req.incidentObj);
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

        req.repo.update(req.incidentObj, data).then(updIncident => {
          res.json(updIncident);
        }).catch(next);

      }

    })

    /** DELETE /api/incidents/:incidentId - Deletes an incident */
    .delete((req, res, next) => {
      req.repo.remove(req.incidentObj).then(() => {
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

        req.repo.changeIncidentUpdateEntry(req.incidentObj, incidentUpdateId, data).then(updIncident => {
          res.json(updIncident);
        }).catch(next);

      }

    });


  return router;

};
