/**
 * TESTING ROUTES - the idea is to test that the right params are being 
 * passed to the repo and whatever comes back from repo is being returned back.
 * There is no real db operations that happen.
 */

import {assert} from 'chai'
import express from 'express';
import request from 'supertest';
import sinon from 'sinon';
import httpStatus from 'http-status';

import componentGroupRoute from './component-group';
import server from '../../server/index';
import {IdNotFoundError} from '../../repositories/errors';

describe('routes/component_groups', function() {

  const staticCurrentTime = new Date().toISOString();

  /**
   * TEST OBJECTS
   */

  const testCmpGroup = {
    name: 'widget',
    sort_order: 2,
    status: 'partial_outage',
    active: true,
    id: 'test123',
    created_at: staticCurrentTime,
    updated_at: staticCurrentTime,
    description: 'desc'
  };

  let testRepoStub = {
    
    name: 'component_groups',

    load(id) {
      return Promise.resolve(testCmpGroup);
    },

    list(filter = {}) {
      return Promise.resolve([testCmpGroup]);
    },

    create(data) {
      return Promise.resolve(testCmpGroup);
    },

    update(obj, data) {
      return Promise.resolve(testCmpGroup);
    },

    remove(obj) {
      return Promise.resolve();
    }

  };

  let app;

  before(async function() {
    app = await server.start({
      PORT: process.env.PORT,
      NODE_ENV: process.env.NODE_ENV
    }, {
      repos: { component: { name: 'components'}, componentGroup: testRepoStub }
    })
  });

  after(function () {
    app.close();
  });


   /**
    * TEST CASES
    */
  
  describe('GET /component_groups', function() {

    it ('should return component groups and 200 response, when no filters passed', function(done) {

      const listSpy = sinon.spy(testRepoStub, 'list');

      request(app)
        .get('/api/component_groups')
        .expect('Content-Type', /json/)
        .expect(200, [testCmpGroup])
        .then(res => {
            
          sinon.assert.calledWith(listSpy, {});
          sinon.assert.calledOnce(listSpy);
          
          listSpy.restore();
          done();
        });

    });

    it ('should return component groups and 200 response, when multiple filters passed', function(done) {

      const listSpy = sinon.spy(testRepoStub, 'list');

      request(app)
        .get('/api/component_groups?active=false&status=good')
        .expect('Content-Type', /json/)
        .expect(200, [testCmpGroup])
        .then(res => {

          sinon.assert.calledWith(listSpy, {active: false, status: 'good'});
          sinon.assert.calledOnce(listSpy);
          
          listSpy.restore();
          done();
        });

    });

    it ('should return 500 response when exception thrown from repo', function (done) {

      // throw error
      const listStub = sinon.stub(testRepoStub, 'list').callsFake((filter) => {
        return Promise.reject({message: 'error'});
      });

      request(app)
        .get('/api/component_groups')
        .expect('Content-Type', /json/)
        .expect(500, { message: httpStatus[500] })
        .then(res => {
          sinon.assert.calledOnce(listStub);
          listStub.restore();
          done();
        });

    });

  });


  describe('POST /component_groups', function() {

    it ('should create and return component group object', function(done) {

      const createSpy = sinon.spy(testRepoStub, 'create');

      const componentgroup = {
        name: '  widget  ' // will be sanitized (trimmed)
      };

      request(app)
        .post('/api/component_groups')
        .send({ componentgroup })
        .expect('Content-Type', /json/)
        .expect(200, testCmpGroup)
        .then(res => {
          
          const expected = { name: 'widget' };

          sinon.assert.calledWith(createSpy, expected);
          sinon.assert.calledOnce(createSpy);

          createSpy.restore();
          done();
        });
    });

    it ('should return 422 b/c of validation error', function(done) {

      // forcing an error from repo
      const createStub = sinon.stub(testRepoStub, 'create').callsFake(data => {
        const e = new Error('validation');
        e.name = 'ValidationError';
        return Promise.reject(e);
      });

      const componentgroup = {
        name: '  widget  ',
        sort_order: '2'
      };

      request(app)
        .post('/api/component_groups')
        .send({ componentgroup })
        .expect('Content-Type', /json/)
        .expect(422, { message: 'validation' })
        .then(res => {
          
          sinon.assert.calledOnce(createStub);

          createStub.restore();
          done();
        });

    });

    it ('should fail b/c of no component posted', function(done) {

      const createSpy = sinon.spy(testRepoStub, 'create');

      request(app)
        .post('/api/component_groups')
        .expect('Content-Type', /json/)
        .expect(422, {message: 'No component group data sent in this request.'})
        .then(res => {
          sinon.assert.notCalled(createSpy);
          createSpy.restore();
          done();
        });

    });

  });

  describe('GET /component_groups/:id', function() {

    it ('should return the component group', function(done) {

      const loadSpy = sinon.spy(testRepoStub, 'load');

      request(app)
        .get(`/api/component_groups/${testCmpGroup.id}`)
        .expect('Content-Type', /json/)
        .expect(200, testCmpGroup)
        .then(res => {
            
          sinon.assert.calledWith(loadSpy, testCmpGroup.id);
          sinon.assert.calledOnce(loadSpy);
          
          loadSpy.restore();
          done();
        });

    });

    it ('should return 422 b/c of invalid component group id', function(done) {

      // force an error
      const loadStub = sinon.stub(testRepoStub, 'load').callsFake(id => {
        throw new IdNotFoundError('Id not found');
      });

      request(app)
        .get(`/api/component_groups/${testCmpGroup.id}`)
        .expect('Content-Type', /json/)
        .expect(422)
        .then(res => {
            
          sinon.assert.calledWith(loadStub, testCmpGroup.id);
          sinon.assert.calledOnce(loadStub);
          
          loadStub.restore();
          done();
        });

    });

  });

  describe('PATCH /component_groups/:id', function() {

    it ('should update a component group and return a 200', function(done) {

      const updateSpy = sinon.spy(testRepoStub, 'update');

      const componentgroup = {
        name: '  widget  ',
        sort_order: '2'
      };

      request(app)
        .patch(`/api/component_groups/${testCmpGroup.id}  `)
        .send({ componentgroup })
        .expect('Content-Type', /json/)
        .expect(200, testCmpGroup)
        .then(res => {
            
           const expected = {
            name: 'widget',
            sort_order: '2'
          };

          sinon.assert.calledWith(updateSpy, testCmpGroup, expected);
          sinon.assert.calledOnce(updateSpy);

          updateSpy.restore();
          done();
        });

    });

    it ('should return 422 b/c of invalid component group id', function(done) {

      const loadStub = sinon.stub(testRepoStub, 'load').callsFake((id, data) => {
        throw new IdNotFoundError('Id not found');
      });

      const componentgroup = {
        name: '  widget  ',
        sort_order: '2'
      };

      request(app)
        .patch(`/api/component_groups/${testCmpGroup.id}  `)
        .send({ componentgroup })
        .expect('Content-Type', /json/)
        .expect(422)
        .then(res => {
          loadStub.restore();
          done();
        });

    });

    it ('should fail b/c of no component group posted', function(done) {

      const updateSpy = sinon.spy(testRepoStub, 'update');

      request(app)
        .patch(`/api/component_groups/${testCmpGroup.id}`)
        .expect('Content-Type', /json/)
        .expect(422, {message: 'No component group data sent in this request.'})
        .then(res => {
          sinon.assert.notCalled(updateSpy);
          updateSpy.restore();
          done();
        });

    });

  });

  describe('DELETE /component_groups/:id', function() {

    it ('should delete a component group', function(done) {

      const removeSpy = sinon.spy(testRepoStub, 'remove');

      request(app)
        .delete(`/api/component_groups/${testCmpGroup.id}`)
        .expect('Content-Type', /json/)
        .expect(200, {message: 'Component Group deleted'})
        .then(res => {
            
          sinon.assert.calledWith(removeSpy, testCmpGroup);
          sinon.assert.calledOnce(removeSpy);
          
          removeSpy.restore();
          done();
        });

    });

    it ('should return 422 b/c of invalid component group id', function(done) {

      const loadStub = sinon.stub(testRepoStub, 'load').callsFake(id => {
        throw new IdNotFoundError('Id not found');
      });

      request(app)
        .delete(`/api/component_groups/${testCmpGroup.id}`)
        .expect('Content-Type', /json/)
        .expect(422)
        .then(res => {
          loadStub.restore();
          done();
        });

    });

  });

  describe('invalid url', function() {

    it ('should return 404 on invalid url', function(done) {

      request(app)
        .get('/api/component_groups/test/test')
        .expect('Content-Type', /json/)
        .expect(404, done);

    });

  });

});

