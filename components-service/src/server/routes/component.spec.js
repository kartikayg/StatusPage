import {assert} from 'chai'
import express from 'express';
import request from 'supertest';
import sinon from 'sinon';
import httpStatus from 'http-status';

import componentRoute from './component';
import server from '../../server/index';
import {IdNotFoundError} from '../../repositories/errors';


describe('routes/component', function() {

  /**
   * TEST OBJECTS
   */

  const testCmp = {
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
    
    name: 'components',

    load(id) {
      return Promise.resolve(testCmp);
    },

    list(filter = {}) {
      return Promise.resolve([testCmp]);
    },

    create(data) {
      return Promise.resolve(testCmp);
    },

    update(id, data) {
      return Promise.resolve(testCmp);
    },

    partialUpdate(id, data) {
      return Promise.resolve(testCmp);
    },

    remove(id) {
      return Promise.resolve();
    }

  };

  let app;

  before(async function() {
    app = await server.start({
      PORT: 6666,
      NODE_ENV: process.env.NODE_ENV
    }, {
      repos: { component: testRepo }
    })
  });


   /**
    * TEST CASES
    */

  describe('init', function() {

    it ('should error if invalid repo passed', function(done) {

      try {
        componentRoute({ name: 'bogus' });
      }
      catch (e) {
        assert.strictEqual(e.message, 'Invalid repo passed to this router. Passed repo name: bogus');
        done();
      }

    });

  });
  
  describe('GET /components', function() {

    it ('should return components and 200 response, when no filters passed', function(done) {

      const listSpy = sinon.spy(testRepo, 'list');

      request(app)
        .get('/api/components')
        .expect('Content-Type', /json/)
        .expect(200, [testCmp])
        .then(res => {
            
          sinon.assert.calledWith(listSpy, {});
          sinon.assert.calledOnce(listSpy);
          
          listSpy.restore();
          done();
        });

    });

    it ('should return components and 200 response, when multiple filters passed', function(done) {

      const listSpy = sinon.spy(testRepo, 'list');

      request(app)
        .get('/api/components?active=false&status=good')
        .expect('Content-Type', /json/)
        .expect(200, [testCmp])
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
        .get('/api/components')
        .expect('Content-Type', /json/)
        .expect(500, { message: httpStatus[500] })
        .then(res => {
          sinon.assert.calledOnce(listStub);
          listStub.restore();
          done();
        });

    });

  });


  describe('POST /components', function() {

    it ('should create and return component object', function(done) {

      const createSpy = sinon.spy(testRepo, 'create');

      const component = {
        name: '  widget  ' // will be sanitized (trimmed)
      };

      request(app)
        .post('/api/components')
        .send({ component })
        .expect('Content-Type', /json/)
        .expect(200, testCmp)
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

      const component = {
        name: '  widget  ',
        sort_order: '2'
      };

      request(app)
        .post('/api/components')
        .send({ component })
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
        .post('/api/components')
        .expect('Content-Type', /json/)
        .expect(422, {message: 'No component data sent in this request.'})
        .then(res => {
          sinon.assert.notCalled(createSpy);
          createSpy.restore();
          done();
        });

    });

  });

  describe('GET /component/:id', function() {

    it ('should return the component', function(done) {

      const loadSpy = sinon.spy(testRepo, 'load');

      request(app)
        .get(`/api/components/${testCmp.id}`)
        .expect('Content-Type', /json/)
        .expect(200, testCmp)
        .then(res => {
            
          sinon.assert.calledWith(loadSpy, testCmp.id);
          sinon.assert.calledOnce(loadSpy);
          
          loadSpy.restore();
          done();
        });

    });

    it ('should return 422 b/c of invalid component id', function(done) {

      // force an error
      const loadStub = sinon.stub(testRepo, 'load').callsFake(id => {
        throw new IdNotFoundError('Id not found');
      });

      request(app)
        .get(`/api/components/${testCmp.id}`)
        .expect('Content-Type', /json/)
        .expect(422)
        .then(res => {
            
          sinon.assert.calledWith(loadStub, testCmp.id);
          sinon.assert.calledOnce(loadStub);
          
          loadStub.restore();
          done();
        });

    });

  });


  describe('PUT /component/:id', function() {

    it ('should update a component and return a 200', function(done) {

      const updateSpy = sinon.spy(testRepo, 'update');

      const component = {
        name: '  widget  ',
        sort_order: '2'
      };

      request(app)
        .put(`/api/components/${testCmp.id}  `)
        .send({ component })
        .expect('Content-Type', /json/)
        .expect(200, testCmp)
        .then(res => {
            
           const expected = {
            name: 'widget',
            sort_order: '2'
          };

          sinon.assert.calledWith(updateSpy, testCmp.id, expected);
          sinon.assert.calledOnce(updateSpy);

          updateSpy.restore();
          done();
        });

    });

    it ('should return 422 b/c of invalid component id', function(done) {

      const updateSpy = sinon.stub(testRepo, 'update').callsFake((id, data) => {
        throw new IdNotFoundError('Id not found');
      });

      const component = {
        name: '  widget  ',
        sort_order: '2'
      };

      request(app)
        .put(`/api/components/${testCmp.id}  `)
        .send({ component })
        .expect('Content-Type', /json/)
        .expect(422)
        .then(res => {
            
           const expected = {
            name: 'widget',
            sort_order: '2'
          };

          sinon.assert.calledWith(updateSpy, testCmp.id, expected);
          sinon.assert.calledOnce(updateSpy);

          updateSpy.restore();
          done();
        });

    });

    it ('should fail b/c of no component posted', function(done) {

      const updateSpy = sinon.spy(testRepo, 'update');

      request(app)
        .put(`/api/components/${testCmp.id}`)
        .expect('Content-Type', /json/)
        .expect(422, {message: 'No component data sent in this request.'})
        .then(res => {
          sinon.assert.notCalled(updateSpy);
          updateSpy.restore();
          done();
        });

    });

  });

  describe('DELETE /component/:id', function() {

    it ('should delete a component', function(done) {

      const removeSpy = sinon.spy(testRepo, 'remove');

      request(app)
        .delete(`/api/components/${testCmp.id}`)
        .expect('Content-Type', /json/)
        .expect(200, {message: 'Component deleted'})
        .then(res => {
            
          sinon.assert.calledWith(removeSpy, testCmp.id);
          sinon.assert.calledOnce(removeSpy);
          
          removeSpy.restore();
          done();
        });

    });

    it ('should return 422 b/c of invalid component id', function(done) {

      const removeStub = sinon.stub(testRepo, 'remove').callsFake(id => {
        throw new IdNotFoundError('Id not found');
      });

      request(app)
        .delete(`/api/components/${testCmp.id}`)
        .expect('Content-Type', /json/)
        .expect(422)
        .then(res => {
            
          sinon.assert.calledWith(removeStub, testCmp.id);
          sinon.assert.calledOnce(removeStub);
          
          removeStub.restore();
          done();
        });

    });

  });

  describe('PATCH /component/:id', function() {

    it ('should partial update a component', function(done) {

      const updateSpy = sinon.spy(testRepo, 'partialUpdate');

      const component = {
        name: '  widget  ',
        sort_order: '2'
      };

      request(app)
        .patch(`/api/components/${testCmp.id}  `)
        .send({ component })
        .expect('Content-Type', /json/)
        .expect(200, testCmp)
        .then(res => {
            
           const expected = {
            name: 'widget',
            sort_order: '2'
          };

          sinon.assert.calledWith(updateSpy, testCmp.id, expected);
          sinon.assert.calledOnce(updateSpy);

          updateSpy.restore();
          done();
        });

    });

    it ('should fail b/c of no component posted', function(done) {

      const updateSpy = sinon.spy(testRepo, 'partialUpdate');

      request(app)
        .patch(`/api/components/${testCmp.id}`)
        .expect('Content-Type', /json/)
        .expect(422, {message: 'No component data sent in this request.'})
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
        .get('/api/components/test/test')
        .expect('Content-Type', /json/)
        .expect(404, done);

    });

  });

});

