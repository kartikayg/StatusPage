/**
 * TESTING ROUTES - the idea is to test that the right params are being 
 * passed to the repo and whatever comes back from repo is being returned back.
 * There is no real db operations that happen.
 */

import {assert} from 'chai'
import request from 'supertest';
import sinon from 'sinon';
import httpStatus from 'http-status';

import incidentRoute from './incident';
import server from '../../server/index';
import {IdNotFoundError, UpdateNotAllowedError} from '../../repositories/errors';


describe('routes/incident', function() {

  /**
   * TEST OBJECTS
   */

  const staticCurrentTime = new Date().toISOString();

  const newIncidentObjPost = {
    name: '  incident  ',
    components: ['component_id'],
    message: '<b>message</b>',
    do_twitter_update: true,
    is_resolved: false,
    do_notify_subscribers: true,
    type: ' realtime ',
    status: ' investigating '
  };

  const sanitizedNewIncidentPostObj = {
    name: 'incident',
    components: ['component_id'],
    message: '<b>message</b>',
    do_twitter_update: true,
    is_resolved: false,
    do_notify_subscribers: true,
    type: 'realtime',
    status: 'investigating'
  };

  const testIncidentObj = {
    id: 'id',
    _id: '_id',
    name: 'incident',
    components: ['component_id'],
    is_resolved: true,
    resolved_at: staticCurrentTime,
    type: 'realtime',
    created_at: staticCurrentTime,
    updated_at: staticCurrentTime,
    updates: [{
      id: 'id',
      _id: '_id',
      created_at: staticCurrentTime,
      updated_at: staticCurrentTime,
      do_twitter_update: true,
      do_notify_subscribers: false,
      status: 'investigating',
      displayed_at: staticCurrentTime,
      message: 'message'
    }, {
      id: 'IU007',
      _id: '_id',
      created_at: staticCurrentTime,
      updated_at: staticCurrentTime,
      do_twitter_update: true,
      do_notify_subscribers: false,
      status: 'resolved',
      message: 'message',
      displayed_at: staticCurrentTime
    }]
  };

  let testRepoStub = {
    
    name: 'incidents',

    load(id) {
      return Promise.resolve(testIncidentObj);
    },

    list(filter = {}) {
      return Promise.resolve([testIncidentObj]);
    },

    create(data) {
      return Promise.resolve(testIncidentObj);
    },

    update(id, data) {
      return Promise.resolve(testIncidentObj);
    },

    remove(id) {
      return Promise.resolve();
    },

    changeIncidentUpdateEntry(id, incidentId, data) {
      return Promise.resolve(testIncidentObj);
    }

  };

  let app;

  before(async function() {
    app = await server.start({
      PORT: process.env.PORT,
      NODE_ENV: process.env.NODE_ENV
    }, {
      repos: { incident: testRepoStub }
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

  describe('init', function() {

    it ('should error if invalid repo passed', function(done) {

      try {
        incidentRoute({ name: 'bogus' });
      }
      catch (e) {
        assert.strictEqual(e.message, 'Invalid repo passed to this router. Passed repo name: bogus');
        done();
      }

    });

  });
  
  describe('GET /incidents', function() {

    it ('should return incidents and 200 response, when no filters passed', function(done) {

      const listSpy = sinon.spy(testRepoStub, 'list');

      request(app)
        .get('/api/incidents')
        .expect('Content-Type', /json/)
        .expect(200, [testIncidentObj])
        .then(res => {
            
          sinon.assert.calledWith(listSpy, {});
          sinon.assert.calledOnce(listSpy);
          
          listSpy.restore();
          done();
        });

    });

    it ('should return incidents and 200 response, when multiple filters passed', function(done) {

      const listSpy = sinon.spy(testRepoStub, 'list');

      request(app)
        .get('/api/incidents?type=realtime&is_resolved=false')
        .expect('Content-Type', /json/)
        .expect(200, [testIncidentObj])
        .then(res => {

          sinon.assert.calledWith(listSpy, {type: 'realtime', is_resolved: 'false'});
          sinon.assert.calledOnce(listSpy);
          
          listSpy.restore();
          done();
        });

    });

    it ('should return 500 response when exception thrown from repo', function (done) {

      // throw error
      const listStub = sinon.stub(testRepoStub, 'list').callsFake((filter) => {
        return Promise.reject({ message: 'error' });
      });

      request(app)
        .get('/api/incidents')
        .expect('Content-Type', /json/)
        .expect(500, { message: httpStatus[500] })
        .then(res => {
          sinon.assert.calledOnce(listStub);
          listStub.restore();
          done();
        });

    });

  });


  describe('POST /incidents', function() {

    it ('should create and return incident object', function(done) {

      const createSpy = sinon.spy(testRepoStub, 'create');

      request(app)
        .post('/api/incidents')
        .send({ incident: newIncidentObjPost })
        .expect('Content-Type', /json/)
        .expect(200, testIncidentObj)
        .then(res => {

          sinon.assert.calledWith(createSpy, sanitizedNewIncidentPostObj);
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

      request(app)
        .post('/api/incidents')
        .send({ incident: newIncidentObjPost })
        .expect('Content-Type', /json/)
        .expect(422, { message: 'validation' })
        .then(res => {
          
          sinon.assert.calledOnce(createStub);

          createStub.restore();
          done();
        });

    });

    it ('should fail b/c of no incident objected posted', function(done) {

      const createSpy = sinon.spy(testRepoStub, 'create');

      request(app)
        .post('/api/incidents')
        .expect('Content-Type', /json/)
        .expect(422, {message: 'No incident data sent in this request.'})
        .then(res => {
          sinon.assert.notCalled(createSpy);
          createSpy.restore();
          done();
        });

    });

  });

  describe('GET /incidents/:id', function() {

    it ('should return the incident based on the id', function(done) {

      const loadSpy = sinon.spy(testRepoStub, 'load');

      request(app)
        .get(`/api/incidents/${testIncidentObj.id}`)
        .expect('Content-Type', /json/)
        .expect(200, testIncidentObj)
        .then(res => {
            
          sinon.assert.calledWith(loadSpy, testIncidentObj.id);
          sinon.assert.calledOnce(loadSpy);

          loadSpy.restore();
          done();
        });

    });

    it ('should return 422 b/c of invalid incident id', function(done) {

      // force an error
      const loadStub = sinon.stub(testRepoStub, 'load').callsFake(id => {
        throw new IdNotFoundError('Id not found');
      });

      request(app)
        .get(`/api/incidents/${testIncidentObj.id}`)
        .expect('Content-Type', /json/)
        .expect(422)
        .then(res => {
            
          sinon.assert.calledWith(loadStub, testIncidentObj.id);
          sinon.assert.calledOnce(loadStub);
          
          loadStub.restore();
          done();
        });

    });

  });


  describe('PATCH /incidents/:id', function() {

    it ('should update a incident and return a 200', function(done) {

      const updateSpy = sinon.spy(testRepoStub, 'update');

      const updateData = {
        message: 'message',
        status: ' resolved '
      };

      request(app)
        .patch(`/api/incidents/${testIncidentObj.id}  `)
        .send({ incident: updateData })
        .expect('Content-Type', /json/)
        .expect(200, testIncidentObj)
        .then(res => {
            
          const expected = {
            message: 'message',
            status: 'resolved'
          };

          sinon.assert.calledWith(updateSpy, testIncidentObj.id, expected);
          sinon.assert.calledOnce(updateSpy);

          updateSpy.restore();
          done();

        });

    });

    it ('should return 422 b/c of invalid incident id', function(done) {

      const updateSpy = sinon.stub(testRepoStub, 'update').callsFake((id, data) => {
        throw new IdNotFoundError('Id not found');
      });

      const updateData = {
        message: '  message  ',
        status: 'resolved'
      };

      request(app)
        .patch(`/api/incidents/${testIncidentObj.id}  `)
        .send({ incident: updateData })
        .expect('Content-Type', /json/)
        .expect(422)
        .then(res => {
            

          sinon.assert.calledWith(updateSpy, testIncidentObj.id, updateData);
          sinon.assert.calledOnce(updateSpy);

          updateSpy.restore();
          done();

        });

    });

    it ('should fail b/c of no incident data posted', function(done) {

      const updateSpy = sinon.spy(testRepoStub, 'update');

      request(app)
        .patch(`/api/incidents/${testIncidentObj.id}`)
        .expect('Content-Type', /json/)
        .expect(422, {message: 'No incident data sent in this request.'})
        .then(res => {
          sinon.assert.notCalled(updateSpy);
          updateSpy.restore();
          done();
        });

    });

  });

  describe('DELETE /incidents/:id', function() {

    it ('should delete an incident based on the id', function(done) {

      const removeSpy = sinon.spy(testRepoStub, 'remove');

      request(app)
        .delete(`/api/incidents/${testIncidentObj.id}`)
        .expect('Content-Type', /json/)
        .expect(200, {message: 'Incident deleted'})
        .then(res => {
            
          sinon.assert.calledWith(removeSpy, testIncidentObj.id);
          sinon.assert.calledOnce(removeSpy);
          
          removeSpy.restore();
          done();
        });

    });

    it ('should return 422 b/c of invalid component group id', function(done) {

      const removeStub = sinon.stub(testRepoStub, 'remove').callsFake(id => {
        throw new IdNotFoundError('Id not found');
      });

      request(app)
        .delete(`/api/incidents/${testIncidentObj.id}`)
        .expect('Content-Type', /json/)
        .expect(422)
        .then(res => {
            
          sinon.assert.calledWith(removeStub, testIncidentObj.id);
          sinon.assert.calledOnce(removeStub);
          
          removeStub.restore();
          done();
        });

    });

  });

  describe('PATCH /incidents/:id/incident_updates/:incidentUpdateId', function() {

    it ('should update an incident-entry and return a 200', function(done) {

      const updateSpy = sinon.spy(testRepoStub, 'changeIncidentUpdateEntry');

      const updateData = {
        message: '<b>message</b>',
        status: ' resolved '
      };

      request(app)
        .patch(`/api/incidents/${testIncidentObj.id}/incident_updates/updId`)
        .send({ update: updateData })
        .expect('Content-Type', /json/)
        .expect(200, testIncidentObj)
        .then(res => {
            
          const expected = {
            message: '<b>message</b>',
            status: 'resolved'
          };

          sinon.assert.calledWith(updateSpy, testIncidentObj.id, 'updId', expected);
          sinon.assert.calledOnce(updateSpy);

          updateSpy.restore();
          done();

        });

    });

    it ('should return 422 b/c of invalid incident-update id', function(done) {

      const updateSpy = sinon.stub(testRepoStub, 'changeIncidentUpdateEntry').callsFake((id, data) => {
        throw new IdNotFoundError('Id not found');
      });

      const updateData = {
        message: '  message  ',
        status: 'resolved'
      };

      request(app)
        .patch(`/api/incidents/${testIncidentObj.id}/incident_updates/updId`)
        .send({ update: updateData })
        .expect('Content-Type', /json/)
        .expect(422)
        .then(res => {

          sinon.assert.calledOnce(updateSpy);

          updateSpy.restore();
          done();

        });

    });

    it ('should fail b/c of no data posted', function(done) {

      const updateSpy = sinon.spy(testRepoStub, 'changeIncidentUpdateEntry');

      request(app)
        .patch(`/api/incidents/${testIncidentObj.id}/incident_updates/updId`)
        .expect('Content-Type', /json/)
        .expect(422, {message: 'No update data sent in this request.'})
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
        .get('/api/incidents/test/test')
        .expect('Content-Type', /json/)
        .expect(404, done);

    });

  });

});

