import {assert} from 'chai';
import joiassert from '../../test/joi-assert';

import incident from './incident';

describe('entity/incident', function() {

  const incidentUpdateTestData = {
    id: 'IU123',
    created_at: (new Date()).toISOString(),
    updated_at: (new Date()).toISOString(),
    message: 'a new incident update',
    status: 'investigating',
    displayed_at: (new Date()).toISOString()
  };

  const incidentTestData = {
    id: 'IC123',
    created_at: (new Date()).toISOString(),
    updated_at: (new Date()).toISOString(),
    name: 'a new incident',
    components: ['component_id'],
    resolved_at: (new Date()).toISOString()
  };

  it ('should validate the object', function () {
    const data = Object.assign({}, incidentTestData);
    data['updates'] = [ incidentUpdateTestData ];
    joiassert.equal(incident.schema, data, data);
  });

  it ('should validate the object with multiple updates', function () {

    const data = Object.assign({}, incidentTestData);
    const anotherUpdate = Object.assign({}, incidentUpdateTestData, {id: 'IU345'});

    data['updates'] = [incidentUpdateTestData, anotherUpdate];

    joiassert.equal(incident.schema, data, data);

  });

  it ('should throw error for missing required values', function () {

    const requiredErr = [
      '"id" is required',
      '"created_at" is required',
      '"updated_at" is required',
      '"name" is required',
      '"updates" is required'
    ];

    joiassert.error(incident.schema, {}, requiredErr);

  });

  it ('should throw an error for when same incident update is added twice', function () {

    const data = Object.assign({}, incidentTestData);
    const anotherUpdate = Object.assign({}, incidentUpdateTestData);

    data['updates'] = [incidentUpdateTestData, anotherUpdate];

    joiassert.error(incident.schema, data, '"updates" position 1 contains a duplicate value');

  });

  it ('should throw an error if there are two incident updates with status resolved', function () {

    const data = Object.assign({}, incidentTestData);
    const update1 = Object.assign({}, incidentUpdateTestData, {status: 'resolved', id: 'IU1'});
    const update2 = Object.assign({}, incidentUpdateTestData, {status: 'investigating', id: 'IU2'});
    const update3 = Object.assign({}, incidentUpdateTestData, {status: 'resolved', id: 'IU3'});

    data['updates'] = [update1, update2, update3];

    joiassert.error(incident.schema, data, '"updates" position 2 contains a duplicate value');

  });

  it ('should throw error for misc invalid values', function () {

    const data = Object.assign({}, incidentTestData, {
      id: 123,
      created_at: '2017-12-12',
      updated_at: '2017-12-12',
      name: 123
    });

    data['updates'] = [ incidentUpdateTestData ];

    const invalidValuesErr = [
      '"id" must be a string',
      '"created_at" with value "2017-12-12" fails to match the required pattern: /\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}.\\d{3}Z/',
      '"updated_at" with value "2017-12-12" fails to match the required pattern: /\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}.\\d{3}Z/',
      '"name" must be a string'
    ];

    joiassert.error(incident.schema, data, invalidValuesErr);

  });

  it ('should return a prefix', function () {
    assert.strictEqual(incident.prefix, 'IC');
  });

});