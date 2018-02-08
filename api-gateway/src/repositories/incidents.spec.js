import { assert } from 'chai';
import sinon from 'sinon';

import mockery from 'mockery';

describe('repo/incidents', function () {

  const testIncidentObj = {
    id: 'IC123',
    name: 'something wrong',
    updates: [
      {
        id: 'IU123',
        message: 'message',
        status: 'resolved'
      }
    ]
  };

  const httpOps = {
    get(url, opts) {
      switch (url) { 
        case '/incidents':
          return Promise.resolve([testIncidentObj]);
      }
    },

    post(url, data) {
      switch (url) { 
        case '/incidents':
          return Promise.resolve(testIncidentObj);
      }
    },

    patch(url, data) {

    },

    remove(url) {
      switch (url) {
        case '/incidents/IC123':
          return Promise.resolve({ message: 'Incident deleted' });
          break;
      }
    }

  };

  // mock the client (../lib/external-client) to return dummy data on the call.
  const externalClientMock = {
    init() {
      return httpOps;
    }
  };

  let repo;

  const clientInitSpy = sinon.spy(externalClientMock, 'init');
  const getOpsSpy = sinon.spy(httpOps, 'get');
  const postOpsSpy = sinon.spy(httpOps, 'post');
  const patchOpsSpy = sinon.spy(httpOps, 'patch');
  const removeOpsSpy = sinon.spy(httpOps, 'remove');

  // on before, setup mockery
  before(function () {

    delete require.cache[require.resolve('../lib/external-client')];
    delete require.cache[require.resolve('./incidents')];

    // setup mockery for the client module. this way if we change
    // from axios to something else, we don't need to worry from
    // testing stand point of view.
    mockery.enable({ warnOnUnregistered: false });
    mockery.registerMock('../lib/external-client', externalClientMock);

    repo = require('./incidents').init();

  });

  // mockery done
  after(function () {
    mockery.deregisterMock('../lib/external-client');
    mockery.disable();
    delete require.cache[require.resolve('../lib/external-client')];
    delete require.cache[require.resolve('./incidents')];
  });


  beforeEach(function() {
    getOpsSpy.reset();
    postOpsSpy.reset();
    patchOpsSpy.reset();
    removeOpsSpy.reset();
  });

  describe('get()', function () {

    it ('should make one call to get incidents', async function () {

      const res = await repo.get();
      
      sinon.assert.calledOnce(getOpsSpy);
      sinon.assert.calledWith(getOpsSpy, '/incidents');
      assert.deepEqual(res, [testIncidentObj]);

    });

  });

  describe('create()', function () {

    it ('should create an incident and call the incidents-service', async function() {

      const dataObj = {
        name: 'name',
        message: 'message',
        status: 'operational'
      };

      const res = await repo.create(dataObj);

      sinon.assert.calledOnce(postOpsSpy);
      sinon.assert.calledWith(postOpsSpy, '/incidents', { incident: dataObj });

      assert.deepEqual(res, testIncidentObj);

    });

  });

  describe('remove()', function () {

    it ('should remove an incident and call the incidents-service', async function() {

      const res = await repo.remove('IC123');

      sinon.assert.calledOnce(removeOpsSpy);
      sinon.assert.calledWith(removeOpsSpy, '/incidents/IC123');

      assert.deepEqual(res, { message : 'Incident deleted'});

    });

  });


});