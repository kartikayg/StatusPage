import {assert} from 'chai';
import joiassert from '../../test/joi-assert';

import omit from 'lodash/fp/omit';

import incidentUpdate from './incident-update';

describe('entity/incident-update', function() {

  it ('should validate the object', function () {

    const data = {
      id: 'IU123',
      created_at: (new Date()).toISOString(),
      updated_at: (new Date()).toISOString(),
      message: 'a new incident update',
      status: 'investigating',
      do_twitter_update: false,
      do_notify_subscribers: true,
      displayed_at: (new Date()).toISOString()
    };

    // the expected result should not have incident_type
    joiassert.equal(incidentUpdate.schema, data, data);

  });

  it ('should validate the object with html message', function () {

    const data = {
      id: 'IU123',
      created_at: (new Date()).toISOString(),
      updated_at: (new Date()).toISOString(),
      message: '<b>a new incident update</b>',
      status: 'investigating',
      do_twitter_update: false,
      do_notify_subscribers: true,
      displayed_at: (new Date()).toISOString()
    };

    joiassert.equal(incidentUpdate.schema, data, data);

  });

  it ('should populate the default values', function () {

    const data = {
      id: 'IU123',
      created_at: (new Date()).toISOString(),
      updated_at: (new Date()).toISOString(),
      message: '<b>a new incident update</b>',
      status: 'investigating',
      displayed_at: (new Date()).toISOString()
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
      created_at: '2017-12-12',
      updated_at: '2017-12-12',
      message: 'a new incident update',
      status: 'resolved',
      displayed_at: '2017-12-12'
    };

    const invalidValuesErr = [
      '"id" must be a string',
      '"created_at" with value "2017-12-12" fails to match the required pattern: /\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}.\\d{3}Z/',
      '"updated_at" with value "2017-12-12" fails to match the required pattern: /\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}.\\d{3}Z/',
      '"displayed_at" with value "2017-12-12" fails to match the required pattern: /\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}.\\d{3}Z/'
    ];

    joiassert.error(incidentUpdate.schema, data, invalidValuesErr);

  });

  it ('should return a prefix', function () {
    assert.strictEqual(incidentUpdate.prefix, 'IU');
  });

});
