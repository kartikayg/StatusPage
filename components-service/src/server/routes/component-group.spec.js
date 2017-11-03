import {assert} from 'chai'
import express from 'express';
import request from 'supertest';
import sinon from 'sinon';
import httpStatus from 'http-status';

import componentGroupRoute from './component-group';
import server from '../../server/index';
import {IdNotFoundError} from '../../repositories/errors';


describe('routes/component', function() {

  /**
   * TEST OBJECTS
   */

  const testCmpGroup = {
    name: 'widget',
    sort_order: 2,
    status: 'partial_outage',
    active: true,
    id: 'test123',
    created_at: 'time',
    updated_at: 'time',
    description: 'desc'
  };

  let testRepo = {
    
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

    update(id, data) {
      return Promise.resolve(testCmpGroup);
    },

    partialUpdate(id, data) {
      return Promise.resolve(testCmpGroup);
    },

    remove(id) {
      return Promise.resolve();
    }

  };

  let app;

  before(async function() {
    app = await server.start({
      PORT: 6667,
      NODE_ENV: process.env.NODE_ENV
    }, {
      repos: { component: { name: 'components'}, componentGroup: testRepo }
    })
  });


   /**
    * TEST CASES
    */

  describe('init', function() {

    it ('should error if invalid repo passed', function(done) {

      try {
        componentGroupRoute({ name: 'bogus' });
      }
      catch (e) {
        assert.strictEqual(e.message, 'Invalid repo passed to this router. Passed repo name: bogus');
        done();
      }

    });

  });
  
  describe('GET /component_groups', function() {

    it ('should return component groups and 200 response, when no filters passed', function(done) {

      const listSpy = sinon.spy(testRepo, 'list');

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

      const listSpy = sinon.spy(testRepo, 'list');

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

    it ('should return 500 response when exception thrown from repo', function(done) {

      // throw error
      const listStub = sinon.stub(testRepo, 'list').callsFake((filter) => {
        return Promise.reject(new Error('error'));
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

      const createSpy = sinon.spy(testRepo, 'create');

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
      const createStub = sinon.stub(testRepo, 'create').callsFake(data => {
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

      const createSpy = sinon.spy(testRepo, 'create');

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

      const loadSpy = sinon.spy(testRepo, 'load');

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
      const loadStub = sinon.stub(testRepo, 'load').callsFake(id => {
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


  describe('PUT /component_groups/:id', function() {

    it ('should update a component group and return a 200', function(done) {

      const updateSpy = sinon.spy(testRepo, 'update');

      const componentgroup = {
        name: '  widget  ',
        sort_order: '2'
      };

      request(app)
        .put(`/api/component_groups/${testCmpGroup.id}  `)
        .send({ componentgroup })
        .expect('Content-Type', /json/)
        .expect(200, testCmpGroup)
        .then(res => {
            
           const expected = {
            name: 'widget',
            sort_order: '2'
          };

          sinon.assert.calledWith(updateSpy, testCmpGroup.id, expected);
          sinon.assert.calledOnce(updateSpy);

          updateSpy.restore();
          done();
        });

    });

    it ('should return 422 b/c of invalid component group id', function(done) {

      const updateSpy = sinon.stub(testRepo, 'update').callsFake((id, data) => {
        throw new IdNotFoundError('Id not found');
      });

      const componentgroup = {
        name: '  widget  ',
        sort_order: '2'
      };

      request(app)
        .put(`/api/component_groups/${testCmpGroup.id}  `)
        .send({ componentgroup })
        .expect('Content-Type', /json/)
        .expect(422)
        .then(res => {
            
           const expected = {
            name: 'widget',
            sort_order: '2'
          };

          sinon.assert.calledWith(updateSpy, testCmpGroup.id, expected);
          sinon.assert.calledOnce(updateSpy);

          updateSpy.restore();
          done();
        });

    });

    it ('should fail b/c of no component group posted', function(done) {

      const updateSpy = sinon.spy(testRepo, 'update');

      request(app)
        .put(`/api/component_groups/${testCmpGroup.id}`)
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

      const removeSpy = sinon.spy(testRepo, 'remove');

      request(app)
        .delete(`/api/component_groups/${testCmpGroup.id}`)
        .expect('Content-Type', /json/)
        .expect(200, {message: 'Component Group deleted'})
        .then(res => {
            
          sinon.assert.calledWith(removeSpy, testCmpGroup.id);
          sinon.assert.calledOnce(removeSpy);
          
          removeSpy.restore();
          done();
        });

    });

    it ('should return 422 b/c of invalid component group id', function(done) {

      const removeStub = sinon.stub(testRepo, 'remove').callsFake(id => {
        throw new IdNotFoundError('Id not found');
      });

      request(app)
        .delete(`/api/component_groups/${testCmpGroup.id}`)
        .expect('Content-Type', /json/)
        .expect(422)
        .then(res => {
            
          sinon.assert.calledWith(removeStub, testCmpGroup.id);
          sinon.assert.calledOnce(removeStub);
          
          removeStub.restore();
          done();
        });

    });

  });

  describe('PATCH /component_groups/:id', function() {

    it ('should partial update a component', function(done) {

      const updateSpy = sinon.spy(testRepo, 'partialUpdate');

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

          sinon.assert.calledWith(updateSpy, testCmpGroup.id, expected);
          sinon.assert.calledOnce(updateSpy);

          updateSpy.restore();
          done();
        });

    });

    it ('should fail b/c of no component group posted', function(done) {

      const updateSpy = sinon.spy(testRepo, 'partialUpdate');

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

  describe('invalid url', function() {

    it ('should return 404 on invalid url', function(done) {

      request(app)
        .get('/api/component_groups/test/test')
        .expect('Content-Type', /json/)
        .expect(404, done);

    });

  });

});

