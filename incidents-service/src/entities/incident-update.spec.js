/**
 * TESTING JOI OBJECT - the idea is to test that the rules set in JOI schema
 * are correct or not.
 */

import {assert} from 'chai';
import joiassert from '../../test/joi-assert';

import omit from 'lodash/fp/omit';

import incidentUpdate from './incident-update';

describe('entity/incident-update', function() {

  it ('should validate the object', function () {

    const data = {
      id: 'IU123',
      created_at: new Date(),
      updated_at: new Date(),
      message: 'a new incident update',
      status: 'investigating',
      do_twitter_update: false,
      do_notify_subscribers: true,
      displayed_at: new Date()
    };

    // the expected result should not have incident_type
    joiassert.equal(incidentUpdate.schema, data, data);

  });

  it ('should validate the object with html message', function () {

    const data = {
      id: 'IU123',
      created_at: new Date(),
      updated_at: new Date(),
      message: '<b>a new incident update</b>',
      status: 'investigating',
      do_twitter_update: false,
      do_notify_subscribers: true,
      displayed_at: new Date()
    };

    joiassert.equal(incidentUpdate.schema, data, data);

  });

  it ('should remove script tag from the html message', function () {

    const data = {
      id: 'IU123',
      created_at: new Date(),
      updated_at: new Date(),
      message: '<script>console.log("hello");</script><b>a new incident update</b>',
      status: 'investigating',
      do_twitter_update: false,
      do_notify_subscribers: true,
      displayed_at: new Date()
    };

    const expected = Object.assign({}, data, { message: '<b>a new incident update</b>'});

    joiassert.equal(incidentUpdate.schema, data, expected);

  });

  it ('should populate the default values', function () {

    const data = {
      id: 'IU123',
      created_at: new Date(),
      updated_at: new Date(),
      message: '<b>a new incident update</b>',
      status: 'investigating',
      displayed_at: new Date()
    };

    const expected = Object.assign({}, data, {
      do_twitter_update: false,
      do_notify_subscribers: false
    });

    joiassert.equal(incidentUpdate.schema, data, expected);

  });

  it ('should throw error for missing required values', function () {

    const requiredErr = [
      '"id" is required',
      '"created_at" is required',
      '"updated_at" is required',
      '"message" is required',
      '"status" is required'
    ];

    joiassert.error(incidentUpdate.schema, {}, requiredErr);

  });

  it ('should throw error for misc invalid values', function () {

    const data = {
      id: 123,
      created_at: 'time',
      updated_at: 'time',
      message: 'a new incident update',
      status: 'resolved',
      displayed_at: 'time'
    };

    const invalidValuesErr = [
      '"id" must be a string',
      '"created_at" must be a valid ISO 8601 date',
      '"updated_at" must be a valid ISO 8601 date',
      '"displayed_at" must be a valid ISO 8601 date'
    ];

    joiassert.error(incidentUpdate.schema, data, invalidValuesErr);

  });

  it ('should return a prefix', function () {
    assert.strictEqual(incidentUpdate.prefix, 'IU');
  });

});
