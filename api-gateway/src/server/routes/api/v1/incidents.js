/**
 * @fileoverview Routes for incidents-service
 */

import express from 'express';

export default (incidentRepo, authMiddleware) => {

  const router = express.Router(); // eslint-disable-line new-cap

  router.route('/incidents')

    .get((req, res, next) => {
      incidentRepo.get().then(resp => {
        return res.json(resp);
      }).catch(next);
    })

    .post(authMiddleware, (req, res, next) => {
      incidentRepo.create(req.body.incident).then(resp => {
        return res.json(resp);
      }).catch(next);
    });

  return router;

};
