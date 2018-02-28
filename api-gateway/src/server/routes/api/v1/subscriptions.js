/**
 * @fileoverview Routes for components service
 */

import express from 'express';

export default (notificationsRepo, authMiddleware) => {

  const router = express.Router(); // eslint-disable-line new-cap

  router.route('/subscriptions')
    .get(authMiddleware, (req, res, next) => {
      notificationsRepo.getSubscriptions().then(subs => {
        return res.json(subs);
      }).catch(next);
    });

  router.route('/subscriptions/:subscriptionId')

    /** removes a subscription */
    .delete(authMiddleware, (req, res, next) => {
      notificationsRepo.removeSubscription(req.params.subscriptionId).then(resp => {
        return res.json(resp);
      }).catch(next);
    });

  return router;

};
