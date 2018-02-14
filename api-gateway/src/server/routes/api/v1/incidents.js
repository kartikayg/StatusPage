/**
 * @fileoverview Routes for incidents-service
 */

import express from 'express';

export default (incidentRepo, authMiddleware) => {

  const router = express.Router(); // eslint-disable-line new-cap

  router.route('/incidents')

    /** Get all incidents */
    .get((req, res, next) => {
      incidentRepo.get().then(resp => {
        return res.json(resp);
      }).catch(next);
    })

    /** creates an incident */
    .post(authMiddleware, (req, res, next) => {
      incidentRepo.create(req.body.incident).then(resp => {
        return res.json(resp);
      }).catch(next);
    });


  router.route('/incidents/:incidentId')

    /** Updates an incident */
    .patch(authMiddleware, (req, res, next) => {
      incidentRepo.update(req.params.incidentId, req.body.incident).then(incident => {
        res.json(incident);
      }).catch(next);
    })

    /** Deletes an incident */
    .delete(authMiddleware, (req, res, next) => {
      incidentRepo.remove(req.params.incidentId).then(resp => {
        return res.json(resp);
      }).catch(next);
    });


  router.route('/incidents/:incidentId/incident_updates/:incidentUpdateId')

    /** updates incident-update entry */
    .patch(authMiddleware, (req, res, next) => {
      incidentRepo.changeIncidentUpdate(
        req.params.incidentId,
        req.params.incidentUpdateId,
        req.body.update
      ).then(resp => {
        return res.json(resp);
      }).catch(next);
    });

  return router;

};
