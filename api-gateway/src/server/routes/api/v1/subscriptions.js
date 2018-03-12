/**
 * @fileoverview Routes for notification service
 */

import express from 'express';

export default (notificationsRepo, authMiddleware) => {

  const router = express.Router(); // eslint-disable-line new-cap

  router.route('/subscriptions')

    // gets all subscriptions
    .get(authMiddleware, (req, res, next) => {
      notificationsRepo.getSubscriptions().then(subs => {
        return res.json(subs);
      }).catch(next);
    })

    // creates a new subscription
    .post((req, res, next) => {
      notificationsRepo.createSubscription(req.body.subscription).then(sub => {
        return res.json(sub);
      }).catch(next);
    });

  router.route('/subscriptions/:subscriptionId')

    // gets a single subscription
    .get((req, res, next) => {
      notificationsRepo.getSubscription(req.params.subscriptionId).then(sub => {
        return res.json(sub);
      }).catch(next);
    })

    // removes a subscription
    .delete((req, res, next) => {
      notificationsRepo.removeSubscription(req.params.subscriptionId).then(resp => {
        return res.json(resp);
      }).catch(next);
    });


  // send confirmation link for a subscription
  router.get('/subscriptions/:subscriptionId/send_confirmation_link', (req, res, next) => {
    notificationsRepo.sendSubscriptionConfirmationLink(req.params.subscriptionId).then(() => {
      res.json({ message: 'Confirmation link sent.'});
    }).catch(next);
  });

  // manage components for a subscription
  router.patch('/subscriptions/:subscriptionId/manage_components', (req, res, next) => {
    const id = req.params.subscriptionId;
    const { components } = req.body;
    notificationsRepo.manageSubscriptionComponents(id, components).then(sub => {
      res.json(sub);
    }).catch(next);
  });

  return router;

};
