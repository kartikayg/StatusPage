import { assert } from 'chai';
import sinon from 'sinon';

import mockery from 'mockery';

describe('repo/components', function () {

  const testComponentObj = {
    id: 'CI-123',
    name: 'api',
    description: 'description',
    status: 'operational',
    group_id: null
  };

  const testGroupObj = {
    id: 'CG-123',
    name: 'group'
  };

  const httpOps = {
    get(url, opts) {
      switch (url) {
        case '/components':
          return Promise.resolve([testComponentObj]);
        case '/component_groups':
          if (opts && opts.params && opts.params.name == 'new-group') {
            return Promise.resolve([]);
          }
          return Promise.resolve([testGroupObj]);
      }
    },

    post(url, data) {
      switch (url) { 
        case '/component_groups':
          return Promise.resolve(testGroupObj);
        case '/components':
          return Promise.resolve(testComponentObj);
      }
    },

    patch(url, data) {
      switch (url) { 
        case '/components/123':
          return Promise.resolve(testComponentObj);
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

  // on before, setup mockery
  before(function () {

    delete require.cache[require.resolve('../lib/external-client')];
    delete require.cache[require.resolve('./components')];


    // setup mockery for the client module. this way if we change
    // from axios to something else, we don't need to worry from
    // testing stand point of view.
    mockery.enable({ warnOnUnregistered: false });
    mockery.registerMock('../lib/external-client', externalClientMock);

    repo = require('./components').init();

  });

  // mockery done
  after(function () {
    mockery.deregisterMock('../lib/external-client');
    mockery.disable();
    delete require.cache[require.resolve('../lib/external-client')];
    delete require.cache[require.resolve('./components')];
  });

  beforeEach(function() {
    getOpsSpy.reset();
    postOpsSpy.reset();
    patchOpsSpy.reset();
  });

  describe('get()', function () {

    it ('should make two call to get components and groups', async function () {

      const res = await repo.get();
      
      sinon.assert.calledTwice(getOpsSpy);

      sinon.assert.calledWith(getOpsSpy, '/components');
      sinon.assert.calledWith(getOpsSpy, '/component_groups');

      assert.deepEqual(res.components, [testComponentObj]);
      assert.deepEqual(res.componentGroups, [testGroupObj]);

    });

  });

  describe('create()', function () {

    it ('should create a component and call the component-service', async function() {

      const dataObj = {
        name: 'name',
        description: 'description',
        status: 'operational',
        extra: 'asdasd',
        group_id: '123'
      };

      const res = await repo.create(dataObj);

      sinon.assert.calledOnce(postOpsSpy);
      sinon.assert.calledWith(postOpsSpy, '/components', { component: {
        name: 'name',
        description: 'description',
        status: 'operational',
        group_id: '123'
      }});

      assert.deepEqual(res, { component: testComponentObj });

    });


    it ("should create a component_group if passed and doesn't exists", async function() {

      const dataObj = {
        name: 'name',
        description: 'description',
        status: 'operational',
        new_group_name: 'new-group'
      };

      const res = await repo.create(dataObj);

      // called twice now, create component and group
      sinon.assert.calledTwice(postOpsSpy);

      sinon.assert.calledWith(postOpsSpy, '/components', { component: {
        name: 'name',
        description: 'description',
        status: 'operational',
        group_id: testGroupObj.id
      }});

       sinon.assert.calledWith(postOpsSpy, '/component_groups', { component_group: {
        name: 'new-group',
        active: true
      }});

      assert.deepEqual(res, { component: testComponentObj, newGroup: testGroupObj } );

    });

    it ('should not create a group as it already exists', async function () {

      const dataObj = {
        name: 'name',
        description: 'description',
        status: 'operational',
        new_group_name: 'test'
      };

      const res = await repo.create(dataObj);

      // called only once for component creation
      sinon.assert.calledOnce(postOpsSpy);

      sinon.assert.calledWith(postOpsSpy, '/components', { component: {
        name: 'name',
        description: 'description',
        status: 'operational',
        group_id: testGroupObj.id
      }});

      sinon.assert.calledOnce(getOpsSpy);
      sinon.assert.calledWith(getOpsSpy, '/component_groups', { params: { name: 'test' } });

      assert.deepEqual(res, { component: testComponentObj } );

    });

  });

  describe('update()', function () {

    it ('should call component service to update', async function () {

      const dataObj = {
        name: 'name',
        description: 'description',
        status: 'operational',
        extra: 'asdasd',
        group_id: '123'
      };

      const res = await repo.update('123', dataObj);

      sinon.assert.calledOnce(patchOpsSpy);
      sinon.assert.calledWith(patchOpsSpy, '/components/123', { component: {
        name: 'name',
        description: 'description',
        status: 'operational',
        group_id: '123'
      }});

      assert.deepEqual(res, { component: testComponentObj });

    });

  });

});
