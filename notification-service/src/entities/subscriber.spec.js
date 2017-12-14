import {assert} from 'chai';
import joiassert from '../../test/joi-assert';
import MockDate from 'mockdate';

import subscriberEntity from './subscriber';

describe('entity/subscriber', function() {

  const staticCurrentTime = new Date();

  before(function() {
    MockDate.set(staticCurrentTime);
  });

  after(function() {
    MockDate.reset();
  });

  it ('should return a prefix', function () {
    assert.strictEqual(subscriberEntity.prefix, 'SB');
  });

  it ('should validate the type', function () {

    const data = {
      id: 'SB123',
      created_at: new Date(),
      updated_at: new Date(),
      is_confirmed: false,
      type: 'type',
      components: ['cid1']
    };

    const invalidValuesErr = [
      '"type" must be one of [email, webhook]'
    ];

    joiassert.error(subscriberEntity.schema, data, invalidValuesErr);

  });

  describe('type#email', function() {

    it ('should validate the object', function () {

      const data = {
        id: 'SB123',
        created_at: new Date(),
        updated_at: new Date(),
        is_confirmed: false,
        type: 'email',
        email: 'kartikayg@gmail.com',
        components: ['cid1']
      };

      // the expected result should not have incident_type
      joiassert.equal(subscriberEntity.schema, data, data);

    });

    it ('should populate the default values', function () {

      const data = {
        id: 'SB123',
        type: 'email',
        email: 'kartikayg@gmail.com'
      };

      const expected = Object.assign({}, data, {
        created_at: staticCurrentTime,
        updated_at: staticCurrentTime,
        components: [],
        is_confirmed: false
      });

      joiassert.equal(subscriberEntity.schema, data, expected);

    });

    it ('should throw error for missing required values', function () {

      const requiredErr = [
        '"id" is required',
        '"email" is required'
      ];

      joiassert.error(subscriberEntity.schema, { type: 'email' }, requiredErr);

    });

    it ('should throw error for invalid values', function () {

      const data = {
        id: 'SB123',
        type: 'email',
        email: 'kartikayg'
      };

      const invalidValuesErr = [
        '"email" must be a valid email'
      ];

      joiassert.error(subscriberEntity.schema, data, invalidValuesErr);

    });

  });

  describe('type#webhook', function() {

    it ('should validate the object', function () {

      const data = {
        id: 'SB123',
        created_at: new Date(),
        updated_at: new Date(),
        is_confirmed: true,
        type: 'webhook',
        uri: 'http://www.ktechtest.com/endpoint',
        components: ['cid1']
      };

      // the expected result should not have incident_type
      joiassert.equal(subscriberEntity.schema, data, data);

    });

    it ('should populate the default values', function () {

      const data = {
        id: 'SB123',
        type: 'webhook',
        uri: 'http://www.ktechtest.com/endpoint',
      };

      const expected = Object.assign({}, data, {
        created_at: staticCurrentTime,
        updated_at: staticCurrentTime,
        components: [],
        is_confirmed: false
      });

      joiassert.equal(subscriberEntity.schema, data, expected);

    });

    it ('should throw error for missing required values', function () {

      const requiredErr = [
        '"id" is required',
        '"uri" is required'
      ];

      joiassert.error(subscriberEntity.schema, { type: 'webhook' }, requiredErr);

    });

    it ('should throw error for invalid values', function () {

      const data = {
        id: 'SB123',
        type: 'webhook',
        uri: 'google.com'
      };

      const invalidValuesErr = [
        '"uri" must be a valid uri'
      ];

      joiassert.error(subscriberEntity.schema, data, invalidValuesErr);

    });

  });

});
