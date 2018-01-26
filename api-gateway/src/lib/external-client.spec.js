const assert = require('chai').assert;
const sinon = require('sinon');

const client = require('./external-client');

const axios = require('axios');

describe('src/lib/external-client', function () {

  let axiosCreateStub, baseClient;

  const baseUrl = 'http://localhost';

  function axiosInstanceMock({ url, method }) {
    if (url === '/error') {
      return Promise.reject(new Error('test123'));
    }
    else {
      return Promise.resolve({
        data: 'data'
      });
    }
  }
  const instanceSpy = sinon.spy(axiosInstanceMock);

  before(function() {
    // create a stub on axios create fn so we can return our
    // own mock instance of axios
    axiosCreateStub = sinon.stub(axios, 'create').callsFake(opts => {
      return instanceSpy;
    });
  });

  after(function() {
    axiosCreateStub.restore();
  });

  beforeEach(function() {
    instanceSpy.reset();
  });

  it ('should initialize a client by creating axios instance', function () {

    baseClient = client.init(baseUrl);

    sinon.assert.calledOnce(axiosCreateStub);
    sinon.assert.calledWith(axiosCreateStub, {
      timeout: 5000,
      baseURL: baseUrl
    });

  });

  it ('should call axios instance for get call', function (done) {

    const opts = { params: '123' };

    baseClient.get('/test', opts).then((resp) => {
      
      sinon.assert.calledOnce(instanceSpy);
      sinon.assert.calledWith(instanceSpy, {
        url: '/test', method: 'get', ...opts
      });

      assert.equal(resp, 'data');

      done();

    });

  });

  it ('should call axios instance for post call', function (done) {

    const data = { domain: 'test.com' };

    baseClient.post('/test', data).then((resp) => {
      
      sinon.assert.calledOnce(instanceSpy);
      sinon.assert.calledWith(instanceSpy, {
        url: '/test', method: 'post', data
      });

      assert.equal(resp, 'data');

      done();

    });

  });

  it ('should call axios instance for delete call', function (done) {
    baseClient.remove('/test').then((resp) => {
      sinon.assert.calledOnce(instanceSpy);
      sinon.assert.calledWith(instanceSpy, { url: '/test', method: 'delete' });
      done();
    });
  });

  it ('should return any error received from the axios call', function (done) {
    baseClient.remove('/error').catch(e => {
      assert.equal(e.message, 'test123');
      done();
    });
  });

});