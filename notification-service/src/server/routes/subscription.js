/**
 * @fileoverview  Subscription routes
 */

import express from 'express';
import httpStatus from 'http-status';

import {params as sanitizeParams} from '../middleware/sanitize';

/**
 * Export the routes
 * @param {object} repo - subscriptions repo
 * @return {object} router
 */
export default (subscriptionRepo) => {

  // express router
  const router = express.Router();

  // set variables in req object based on the subscription id in the
  // url. the param() doesn't accept multiple route parameters, so some
  // funky code is done to get around it.
  router.param('subscriptionId', (req, res, next) => {  
 
    const load = () => {
      const { subscriptionId } = req.sanitizedParams;
      subscriptionRepo.load(subscriptionId).then(o => {
        req.subscriptionObj = o;
        subscriptionRepo.ofType(o.type).then(t => {
          req.repo = t;
          next();
        });
      }).catch(next);
    };

    sanitizeParams()(req, res, load);

  });

  router.route('/')

    /** GET /api/subscriptions - list of subscriptions */
    .get((req, res, next) => {
      subscriptionRepo.list(req.sanitizedQuery).then(subscriptions => {
        res.json(subscriptions);
      }).catch(next);
    })

    /** POST /api/subscriptions - creates a subscription */
    .post((req, res, next) => {

      const data = req.sanitizedBody.subscription;

      // not a valid subscription object sent
      if (!data || typeof data !== 'object') {
        res.status(httpStatus.UNPROCESSABLE_ENTITY).json({ message: 'No subscription data sent in this request.' });
      }
      else {
        subscriptionRepo.ofType(data.type).then(repo => {
          return repo.subscribe(data);
        }).then(newSubscription => {
          res.json(newSubscription);
        }).catch(next);
      }
    });

  router.route('/:subscriptionId')

    // gets a subscription
    .get((req, res, next) => {
      res.json(req.subscriptionObj);
    })

    // unsubscribe
    .delete((req, res, next) => {
      req.repo.unsubscribe(req.subscriptionObj).then(() => {
        res.json({ message: 'Subscription removed' });
      }).catch(next);
    });


  // PATCH - confirm subscription
  router.patch('/:subscriptionId/confirm', (req, res, next) => {
    req.repo.markConfirmed(req.subscriptionObj).then(updatedObj => {
      res.json(updatedObj);
    }).catch(next);
  });

  // PATCH - manage components
  router.patch('/:subscriptionId/manage_components', (req, res, next) => {
    const { components } = req.sanitizedBody;
    req.repo.manageComponents(req.subscriptionObj, components).then(updatedObj => {
      res.json(updatedObj);
    }).catch(next);
  });

  // GET - send confirmation link
  router.get('/:subscriptionId/send_confirmation_link', (req, res, next) => {
    req.repo.sendConfirmationLink(req.subscriptionObj).then(() => {
      res.json({ message: 'Confirmation link sent.'});
    }).catch(next);
  });


  return router;

};
