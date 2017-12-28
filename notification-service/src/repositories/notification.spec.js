/**
 * TESTING REPO - the idea is to test that the right params are being 
 * passed to the db dao's and whatever comes back from dao is being returned back.
 *
 * Note: There is no real db operations happening.
 */

import {assert} from 'chai';
import sinon from 'sinon';

import notificationRepo from './notification';

import _cloneDeep from 'lodash/fp/cloneDeep';

describe('repo/notification', function() {

  /**
   * MOCK VARIABLES
   */

  const emailSubObj = {
    type: 'email',
    email: 'valid@gmail.com',
    components: ['email'],
    is_confirmed: true
  };

  const webhookSubObj = {
    type: 'webhook',
    uri: 'endpoint',
    components: ['webhook'],
    is_confirmed: true
  };

  const notifyOfNewIncidentUpdateForEmailSpy = sinon.spy();
  const notifyOfNewIncidentUpdateForWebhookSpy = sinon.spy();

  const subscriptionRepoMock = {
    
    list(pred) {

      const c = pred.components.sort().toString();

      switch (c) {
        case 'nosub':
          return [];
        case 'email':
          return [emailSubObj, emailSubObj];
        case 'webhook':
          return [webhookSubObj];
        case 'email,webhook':
          return [emailSubObj, webhookSubObj];
      }

    },

    ofType(type) {
      switch (type) {
        case 'email':
          return Promise.resolve({
            notifyOfNewIncidentUpdate: notifyOfNewIncidentUpdateForEmailSpy
          });
        case 'webhook':
          return Promise.resolve({
            notifyOfNewIncidentUpdate: notifyOfNewIncidentUpdateForWebhookSpy
          });
      }
    }

  };

  const subscriptionRepoListSpy = sinon.spy(subscriptionRepoMock, 'list');

  const repo = notificationRepo.init(subscriptionRepoMock);

  beforeEach(function() {
    notifyOfNewIncidentUpdateForEmailSpy.reset();
    notifyOfNewIncidentUpdateForWebhookSpy.reset();
    subscriptionRepoListSpy.reset();
  });

  const existingIncidentObj = {
    id: 'IC123',
    name: 'incident',
    is_resolved: false,
    resolved_at: null,
    type: 'realtime',
    updates: [{
      id: 'IU123',
      do_notify_subscribers: true,
      status: 'investigating',
      message: 'message',
      displayed_at: new Date()
    }]
  };

  it ('should not call the notify fn when there are no subscriptions', async function () {

    const inc = Object.assign(_cloneDeep(existingIncidentObj), {
      components: ['nosub']
    });

    await repo.onNewIncidentUpdate(inc);

    sinon.assert.calledOnce(subscriptionRepoListSpy);
    
    // no notification called
    sinon.assert.notCalled(notifyOfNewIncidentUpdateForEmailSpy);
    sinon.assert.notCalled(notifyOfNewIncidentUpdateForWebhookSpy);

  });

  it ('should only notify for two email subscriptions', async function () {

    const inc = Object.assign(_cloneDeep(existingIncidentObj), {
      components: ['email']
    });

    await repo.onNewIncidentUpdate(inc);

    const objSent = {
      id: inc.id,
      name: inc.name,
      status: inc.updates[0].status,
      message: inc.updates[0].message,
      displayed_at: inc.updates[0].displayed_at
    };

    sinon.assert.calledOnce(notifyOfNewIncidentUpdateForEmailSpy);
    sinon.assert.calledWith(notifyOfNewIncidentUpdateForEmailSpy, [emailSubObj, emailSubObj], objSent);

    sinon.assert.notCalled(notifyOfNewIncidentUpdateForWebhookSpy);

  });

  it ('should not call any notification as do_notify_subscribers is false', async function () {

    const inc = Object.assign(_cloneDeep(existingIncidentObj), {
      components: ['email']
    });

    inc.updates[0].do_notify_subscribers = false;

    await repo.onNewIncidentUpdate(inc);

    sinon.assert.notCalled(notifyOfNewIncidentUpdateForEmailSpy);
    sinon.assert.notCalled(notifyOfNewIncidentUpdateForWebhookSpy);

  });

  it ('should only notify for one webhook subscriptions', async function () {

    const inc = Object.assign(_cloneDeep(existingIncidentObj), {
      components: ['webhook']
    });

    await repo.onNewIncidentUpdate(inc);

    sinon.assert.calledOnce(notifyOfNewIncidentUpdateForWebhookSpy);
    sinon.assert.calledWith(notifyOfNewIncidentUpdateForWebhookSpy, [webhookSubObj]);

    sinon.assert.notCalled(notifyOfNewIncidentUpdateForEmailSpy);

  });

  it ('should call notification on email and webhook', async function () {

    const inc = Object.assign(_cloneDeep(existingIncidentObj), {
      components: ['webhook', 'email']
    });

    await repo.onNewIncidentUpdate(inc);

    sinon.assert.calledOnce(notifyOfNewIncidentUpdateForWebhookSpy);
    sinon.assert.calledOnce(notifyOfNewIncidentUpdateForEmailSpy);

  });

});

