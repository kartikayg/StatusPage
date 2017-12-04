import {assert} from 'chai';
import joiassert from '../../test/joi-assert';

import incident from './incident';

describe('entity/incident', function() {

  const incidentUpdateTestData = {
    id: 'IU123',
    created_at: new Date(),
    updated_at: new Date(),
    message: 'a new incident update',
    status: 'investigating',
    do_twitter_update: false,
    do_notify_subscribers: true,
    displayed_at: new Date()
  };

  const incidentTestData = {
    id: 'IC123',
    created_at: new Date(),
    updated_at: new Date(),
    name: 'a new incident',
    type: 'realtime',
    components: ['component_id'],
    resolved_at: new Date(),
    is_resolved: true 
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
      '"type" is required',
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

  it ('should throw error if resolved_at is set if is_resolved is false', function () {

    const data = Object.assign({}, incidentTestData);
    data.is_resolved = false;
    data['updates'] = [ incidentUpdateTestData ];

    joiassert.error(incident.schema, data, '"resolved_at" must be one of [null]');

  });

  it ('should throw error if resolved_at is not set if is_resolved is true', function () {

    const data = Object.assign({}, incidentTestData);
    delete data.resolved_at;
    data['updates'] = [ incidentUpdateTestData ];

    joiassert.error(incident.schema, data, '"resolved_at" is required');

  });

  it ('should throw error for misc invalid values', function () {

    const data = Object.assign({}, incidentTestData, {
      id: 123,
      created_at: 'time',
      updated_at: 'time',
      name: 123,
      type: 'type'
    });

    data['updates'] = [ incidentUpdateTestData ];

    const invalidValuesErr = [
      '"id" must be a string',
      '"created_at" must be a valid ISO 8601 date',
      '"updated_at" must be a valid ISO 8601 date',
      '"name" must be a string',
      '"type" must be one of [realtime, scheduled, backfilled]'
    ];

    joiassert.error(incident.schema, data, invalidValuesErr);

  });

  it ('should return a prefix', function () {
    assert.strictEqual(incident.prefix, 'IC');
  });

  describe ('type#backfilled', function () {

    const bfIncidentTestData = Object.assign({}, incidentTestData, { type: 'backfilled' });
    const bfIncidentUpdateTestData = Object.assign({}, incidentUpdateTestData, { status: 'resolved' });

    it ('should validate the incident object', function () {
      const data = Object.assign({}, bfIncidentTestData);
      data['updates'] = [ bfIncidentUpdateTestData ];
      joiassert.equal(incident.schema, data, data);
    });

    it ('should only allow 1 incident update entry', function () {

      const data = Object.assign({}, bfIncidentTestData);
      const anotherUpdate = Object.assign({}, bfIncidentUpdateTestData, {id: 'IU345'});

      data['updates'] = [ bfIncidentUpdateTestData, anotherUpdate ];
      
      joiassert.error(incident.schema, data, '"updates" must contain 1 items');

    });

    it ('should allow only resolved status for incident update', function () {

      const data = Object.assign({}, bfIncidentTestData);
      data['updates'] = [ Object.assign({}, bfIncidentUpdateTestData, {status: 'completed'}) ];
      
      joiassert.error(incident.schema, data, '"status" must be one of [resolved]');

    });

  });

  describe ('type#realtime', function () {

    const rlIncidentTestData = Object.assign({}, incidentTestData, { type: 'realtime' });
    const rlIncidentUpdateTestData = Object.assign({}, incidentUpdateTestData, { status: 'resolved' });

    it ('should validate the incident object', function () {
      const data = Object.assign({}, rlIncidentTestData);
      data['updates'] = [ rlIncidentUpdateTestData ];
      joiassert.equal(incident.schema, data, data);
    });

    it ('should fail if no update entry', function () {

      const data = Object.assign({}, rlIncidentTestData);
      data['updates'] = [];
      
      joiassert.error(incident.schema, data, '"updates" must contain at least 1 items');

    });

    it ('should fail for an invalid status', function () {

      const data = Object.assign({}, rlIncidentTestData);
      data['updates'] = [ Object.assign({}, rlIncidentUpdateTestData, {status: 'completed'}) ];
      
      joiassert.error(incident.schema, data, '"status" must be one of [investigating, identified, monitoring, resolved, update]');

    });

    it ('should fail if two incident-update with resolved status', function () {

      const data = Object.assign({}, rlIncidentTestData);
      const anotherUpdate = Object.assign({}, rlIncidentUpdateTestData, {id: 'IU345'});

      data['updates'] = [ rlIncidentUpdateTestData, anotherUpdate ];
      
      joiassert.error(incident.schema, data, '"updates" position 1 contains a duplicate value');

    });

  });

  describe ('type#scheduled', function () {

    const scIncidentTestData = Object.assign({}, incidentTestData, { 
      type: 'scheduled',
      scheduled_status: 'completed',
      scheduled_start_time: new Date(),
      scheduled_end_time: new Date(),
      scheduled_auto_status_updates: true,
      scheduled_auto_updates_send_notifications: true
    });
    const scIncidentUpdateTestData = Object.assign({}, incidentUpdateTestData, { status: 'resolved' });

    it ('should validate the incident object', function () {
      const data = Object.assign({}, scIncidentTestData);
      data['updates'] = [ scIncidentUpdateTestData ];
      joiassert.equal(incident.schema, data, data);
    });

    it ('should fail if no update entry', function () {

      const data = Object.assign({}, scIncidentTestData);
      data['updates'] = [];
      
      joiassert.error(incident.schema, data, '"updates" must contain at least 1 items');

    });

    it ('should throw error for missing required values', function () {

      const requiredErr = [
        '"scheduled_start_time" is required',
        '"scheduled_end_time" is required'
      ];

      const data = Object.assign({}, scIncidentTestData);
      data['updates'] = [ scIncidentUpdateTestData ];

      delete data.scheduled_start_time;
      delete data.scheduled_end_time;

      joiassert.error(incident.schema, data, requiredErr);

    });

    it ('should fail for an invalid status', function () {

      const data = Object.assign({}, scIncidentTestData);
      data['updates'] = [ Object.assign({}, scIncidentUpdateTestData, {status: 'error'}) ];
      
      joiassert.error(incident.schema, data, '"status" must be one of [scheduled, in_progress, verifying, resolved, cancelled, update]');

    });

    it ('should fail if two incident-update with resolved status', function () {

      const data = Object.assign({}, scIncidentTestData);
      const anotherUpdate = Object.assign({}, scIncidentUpdateTestData, {id: 'IU345'});

      data['updates'] = [ scIncidentUpdateTestData, anotherUpdate ];
      
      joiassert.error(incident.schema, data, '"updates" position 1 contains a duplicate value');

    });

  });

});