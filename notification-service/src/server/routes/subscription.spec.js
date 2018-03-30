/**
 * TESTING ROUTES - the idea is to test that the right params are being 
 * passed to the repo and whatever comes back from repo is being returned back.
 * 
 * NOTE: There is no real db operations that happening.
 */

import {assert} from 'chai'
import request from 'supertest';
import sinon from 'sinon';
import httpStatus from 'http-status';

import subscriptionsRoute from './subscription';
import server from '../../server/index';
import {IdNotFoundError, InvalidSubscriptionTypeError, DuplicatedSubscriptionError} from '../../repositories/errors';


describe('routes/subscriptions', function() {

  /**
   * TEST OBJECTS
   */

  const staticCurrentTime = new Date().toISOString();
  
  const testSubscriptionId = 'SB123';
  const newSubscriptionObj = {
    type: 'email',
    email: '  kartikayg@gmail.com  ', // spaces will be trimmed
    components: ['cid_1']
  };
  const existingSubscriptionObj = Object.assign({}, newSubscriptionObj, {
    id: testSubscriptionId,
    created_at: staticCurrentTime,
    updated_at: staticCurrentTime,
    is_confirmed: false,
    email: newSubscriptionObj.email.trim()
  });

  // email repo
  const testEmailRepoStub = {
    subscribe(data) {
      return Promise.resolve(existingSubscriptionObj);
    },

    unsubscribe(obj) {
      return Promise.resolve(1);
    },

    markConfirmed(obj) {
      return Promise.resolve(existingSubscriptionObj);
    },

    sendConfirmationLink(obj) {
      return Promise.resolve();
    },

    manageComponents(obj) {
      return Promise.resolve(existingSubscriptionObj);
    }

  };

  // main subscription repo
  const testSubscriptionRepoStub = {
    
    name: 'subscriptions',

    load(id) {
      return Promise.resolve(existingSubscriptionObj);
    },

    list(filter) {
      return Promise.resolve([existingSubscriptionObj]);
    },

    ofType(type) {
      switch (type) {
        case 'email':
          return Promise.resolve(testEmailRepoStub);
        case 'webhook':
          break;
        default:
           return Promise.reject(new InvalidSubscriptionTypeError(type));
          break;
      }
    }
  };

  const ofTypeSpy = sinon.spy(testSubscriptionRepoStub, 'ofType');

  let app;

  before(async function() {
    app = await server.start({
      PORT: process.env.PORT,
      NODE_ENV: process.env.NODE_ENV
    }, {
      repos: { subscription: testSubscriptionRepoStub }
    })
  });

  after(function () {
    app.close();
  });


  /**
   * TEST CASES
   */

  // the idea is to test that the right params are being passed to the repo
  // and whatever comes back from repo is being returned back. 

  // retrieving subscriptions
  describe('GET /subscriptions', function() {

    it ('should call repo subscribe and return 200 response - with no filters passed', function(done) {

      const listSpy = sinon.spy(testSubscriptionRepoStub, 'list');

      request(app)
        .get('/notification-service/api/subscriptions')
        .expect('Content-Type', /json/)
        .expect(200, [existingSubscriptionObj])
        .then(res => {
          sinon.assert.calledWith(listSpy, {});
          sinon.assert.calledOnce(listSpy);
          listSpy.restore();
          done();
        });

    });

    it ('should call repo subscribe and return 200 response - with multiple filters passed', function(done) {

      const listSpy = sinon.spy(testSubscriptionRepoStub, 'list');

      request(app)
        .get('/notification-service/api/subscriptions?type=email&is_confirmed=false')
        .expect('Content-Type', /json/)
        .expect(200, [existingSubscriptionObj])
        .then(res => {
          sinon.assert.calledWith(listSpy, { type: 'email', is_confirmed: 'false' });
          sinon.assert.calledOnce(listSpy);
          listSpy.restore();
          done();
        });

    });

    it ('should return 500 response when exception thrown from repo', function (done) {

      // throw error
      const listStub = sinon.stub(testSubscriptionRepoStub, 'list').callsFake((filter) => {
        return Promise.reject({ message: 'error' });
      });

      request(app)
        .get('/notification-service/api/subscriptions')
        .expect('Content-Type', /json/)
        .expect(500, { message: httpStatus[500] })
        .then(res => {
          sinon.assert.calledOnce(listStub);
          listStub.restore();
          done();
        });

    });

  });

  // creating a subscription
  describe('POST /subscriptions', function() {

    let subscribeSpy;

    beforeEach(function() {
      subscribeSpy = sinon.spy(testEmailRepoStub, 'subscribe');
      ofTypeSpy.reset();
    });

    afterEach(function() {
      subscribeSpy.restore();
    });

    it ('should call repo subscribe', function (done) {

      request(app)
        .post('/notification-service/api/subscriptions')
        .send({ subscription: newSubscriptionObj })
        .expect('Content-Type', /json/)
        .expect(200, existingSubscriptionObj)
        .then(res => {
          sinon.assert.calledWith(ofTypeSpy, 'email');
          sinon.assert.calledOnce(ofTypeSpy);

          sinon.assert.calledOnce(subscribeSpy);
          // sinon.assert.calledWith(subscribeSpy, );

          done();
        });
    });

    it ('should return 422 b/c of invalid type', function (done) {

      request(app)
        .post('/notification-service/api/subscriptions')
        .send({ subscription: { type: 'abcd' } })
        .expect('Content-Type', /json/)
        .expect(422, { message: 'Invalid Subscription type: abcd' })
        .then(res => {
          sinon.assert.calledWith(ofTypeSpy, 'abcd');
          sinon.assert.calledOnce(ofTypeSpy);
          done();
        });

    });

    it ('should return 422 b/c of validation error', function(done) {

      // restore here b/c we will be adding a stub on it, as u can see below.
      subscribeSpy.restore();

      // forcing an error from repo
      const subscribeStub = sinon.stub(testEmailRepoStub, 'subscribe').callsFake(data => {
        const e = new Error('validation');
        e.name = 'ValidationError';
        return Promise.reject(e);
      });

      request(app)
        .post('/notification-service/api/subscriptions')
        .send({ subscription: newSubscriptionObj })
        .expect('Content-Type', /json/)
        .expect(422, { message: 'validation' })
        .then(res => {
          sinon.assert.calledOnce(subscribeStub);
          subscribeStub.restore();
          done();
        });

    });

    it ('should fail b/c of no subscription object posted', function(done) {
      request(app)
        .post('/notification-service/api/subscriptions')
        .expect('Content-Type', /json/)
        .expect(422, { message: 'No subscription data sent in this request.' })
        .then(res => {
          sinon.assert.notCalled(subscribeSpy);
          done();
        });
    });

  });

  // getting a subscription
  describe('GET /subscriptions/:id', function() {

    it ('should call repo load() with the ID', function(done) {

      const loadSpy = sinon.spy(testSubscriptionRepoStub, 'load');

      request(app)
        .get(`/notification-service/api/subscriptions/${testSubscriptionId}  `)
        .expect('Content-Type', /json/)
        .expect(200, existingSubscriptionObj)
        .then(res => {
          sinon.assert.calledWith(loadSpy, testSubscriptionId);
          sinon.assert.calledOnce(loadSpy);
          loadSpy.restore();
          done();
        });

    });

    it ('should return 422 b/c of invalid subscription id', function(done) {

      // force an error
      const loadStub = sinon.stub(testSubscriptionRepoStub, 'load').callsFake(id => {
        return Promise.reject(new IdNotFoundError('Id not found'));
      });

      request(app)
        .get(`/notification-service/api/subscriptions/${testSubscriptionId}`)
        .expect('Content-Type', /json/)
        .expect(422, { message: 'Id not found' })
        .then(res => {
          sinon.assert.calledWith(loadStub, testSubscriptionId);
          loadStub.restore();
          done();
        });

    });

  });

  // confirming a subscription
  describe('PATCH /subscriptions/:id/confirm', function() {

    it ('should call repo confirm() for the subscription obj', function(done) {

      const confirmSpy = sinon.spy(testEmailRepoStub, 'markConfirmed');

      request(app)
        .patch(`/notification-service/api/subscriptions/${testSubscriptionId}/confirm`)
        .send({ components: ['cid_1', 'cid_2'] })
        .expect('Content-Type', /json/)
        .expect(200, existingSubscriptionObj)
        .then(res => {
          sinon.assert.calledWith(confirmSpy, existingSubscriptionObj);
          sinon.assert.calledOnce(confirmSpy);
          confirmSpy.restore();
          done();
        });

    });

    it ('should return 422 b/c of invalid subscription id', function(done) {

      // force an error
      const loadStub = sinon.stub(testSubscriptionRepoStub, 'load').callsFake(id => {
        return Promise.reject(new IdNotFoundError('Id not found'));
      });

      request(app)
        .patch(`/notification-service/api/subscriptions/${testSubscriptionId}/confirm`)
        .expect('Content-Type', /json/)
        .expect(422, { message: 'Id not found' })
        .then(res => {
          loadStub.restore();
          done();
        });

    });

  });

  // manage components
  describe('PATCH /subscriptions/:id/manage_components', function() {

    it ('should called repo manageComponents', function(done) {

      const manageComponentsSpy = sinon.spy(testEmailRepoStub, 'manageComponents');

      request(app)
        .patch(`/notification-service/api/subscriptions/${testSubscriptionId}/manage_components`)
        .expect('Content-Type', /json/)
        .expect(200, existingSubscriptionObj)
        .then(res => {
          sinon.assert.calledWith(manageComponentsSpy, existingSubscriptionObj);
          sinon.assert.calledOnce(manageComponentsSpy);
          manageComponentsSpy.restore();
          done();
        });

    });

  });

  // send confirmation link
  describe('GET /subscriptions/:id/send_confirmation_link', function() {

    it ('should called repo send_confirm_link', function(done) {

      const sendConfirmLinkSpy = sinon.spy(testEmailRepoStub, 'sendConfirmationLink');

      request(app)
        .get(`/notification-service/api/subscriptions/${testSubscriptionId}/send_confirmation_link`)
        .expect('Content-Type', /json/)
        .expect(200, { message: 'Confirmation link sent.' })
        .then(res => {
          sinon.assert.calledWith(sendConfirmLinkSpy, existingSubscriptionObj);
          sinon.assert.calledOnce(sendConfirmLinkSpy);
          sendConfirmLinkSpy.restore();
          done();
        });

    });

  });

  // unsubscribe
  describe('DELETE /subscriptions/:id', function() {

    it ('should called repo unsubscribe()', function(done) {

      const unsubscribeSpy = sinon.spy(testEmailRepoStub, 'unsubscribe');

      request(app)
        .delete(`/notification-service/api/subscriptions/${testSubscriptionId}`)
        .expect('Content-Type', /json/)
        .expect(200, { message: 'Subscription removed' })
        .then(res => {
          sinon.assert.calledWith(unsubscribeSpy, existingSubscriptionObj);
          sinon.assert.calledOnce(unsubscribeSpy);
          unsubscribeSpy.restore();
          done();
        });

    });

  });

  describe('invalid url', function() {

    it ('should return 404 on invalid url', function(done) {

      request(app)
        .get('/notification-service/api/subscriptions/test/test')
        .expect('Content-Type', /json/)
        .expect(404, done);

    });

  });


});

