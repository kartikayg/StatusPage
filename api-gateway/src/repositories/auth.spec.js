/**
 * TESTING REPO - 
 *
 * Note: There is no real redis operations that happen.
 */

import jwt from 'jsonwebtoken';

import {assert} from 'chai';
import sinon from 'sinon';

import config from '../config';
import authRepo from './auth';

describe('repo/auth', function() {

  let repo, authConf;


  // redis mock obj
  const redisMockObj = {
    set() {
      return Promise.resolve('OK');
    },
    get(key) {
      return Promise.resolve('value');
    }
  };

  before(function() {
    config.load(process.env);
    repo = authRepo.init(redisMockObj);
    authConf = config.conf.auth;
  });

  after(function() {
    config.reset();
  });

  describe ('login()', function () {

    it ('should return a token on valid login', async function () {

      const jwtSignSpy = sinon.spy(jwt, 'sign');

      const token = await repo.login(authConf.ADMIN_USERNAME, authConf.ADMIN_PASSWORD);

      assert.isString(token);

      const payload = jwt.verify(token, authConf.JWT_SECRET_KEY);

      assert.equal(payload.username, 'admin');
      assert.equal(payload.type, 'APP');

      sinon.assert.calledOnce(jwtSignSpy);
      jwtSignSpy.restore();

    });

    it ('should error because of invalid username/password', function (done) {

      repo.login(authRepo.ADMIN_USERNAME, 'asdasd').catch(e => {
        assert.equal(e.name, 'InvalidCredentialsError');
        done();
      });

    });

  });

  describe ('generateApiToken()', function () {

    it ('should generate a new token', async function () {

      const redisSetSpy = sinon.spy(redisMockObj, 'set');

      const token = await repo.generateApiToken();

      assert.isString(token);

      sinon.assert.calledOnce(redisSetSpy);
      sinon.assert.calledWith(redisSetSpy, 'api-token', token);

      redisSetSpy.restore();

    });

  });

  describe ('getApiToken()', function () {

    it ('should return the existing token from redis', async function () {

      const t = 'token';
      const redisGetStub = sinon.stub(redisMockObj, 'get').callsFake(key => {
        return Promise.resolve(t);
      });

      const token = await repo.getApiToken();

      assert.equal(token, t);

      sinon.assert.calledOnce(redisGetStub);
      sinon.assert.calledWith(redisGetStub, 'api-token');

      redisGetStub.restore();

    });

    it ('should generate the token as nothing exists', async function () {

      const redisGetStub = sinon.stub(redisMockObj, 'get').callsFake(key => {
        return Promise.resolve(null);
      });

      const generateSpy = sinon.spy(repo, 'generateApiToken');

      const token = await repo.getApiToken();

      assert.isString(token);

      sinon.assert.calledOnce(generateSpy);

      redisGetStub.restore();
      generateSpy.restore();

    });

  });

  describe ('verifyToken()', function () {

    it ('should return false for invalid token', async function () {
      const res = await repo.verifyToken('1234');
      assert.strictEqual(res, false);
    });

    it ('should return user info for APP user token', async function () {

      const jwtVerifySpy = sinon.spy(jwt, 'verify');

      // generate a token
      const token = await repo.login(authConf.ADMIN_USERNAME, authConf.ADMIN_PASSWORD);

      const user = await repo.verifyToken(token);

      assert.equal(user.username, 'admin');
      assert.equal(user.type, 'APP');

      sinon.assert.calledOnce(jwtVerifySpy);
      jwtVerifySpy.restore();

    });

    it ('should return api user info for API token', async function () {

      const apiToken = await repo.generateApiToken();

      const redisGetStub = sinon.stub(redisMockObj, 'get').callsFake(key => {
        return Promise.resolve(apiToken);
      });

      const user = await repo.verifyToken(apiToken);

      assert.strictEqual(user.type, 'API');

      redisGetStub.restore();

    });



    it ('should return false for API token - its valid, but not the current one', async function () {

      const apiToken = await repo.generateApiToken();

      const res = await repo.verifyToken(apiToken);

      assert.strictEqual(res, false);

    });


  });

});
