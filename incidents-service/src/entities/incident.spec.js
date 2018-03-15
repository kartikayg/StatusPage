/**
 * TESTING JOI OBJECT - the idea is to test that the rules set in JOI schema
 * are correct or not.
 */

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
    do_notify_subscribers: true,
    displayed_at: new Date()
  };

  const incidentTestData = {
    id: 'IC123',
    created_at: new Date(),
    updated_at: new Date(),
    name: 'a new incident',
    resolved_at: new Date(),
    is_resolved: true ,
    latest_status: 'investigating'
  };

  describe ('type#realtime', function () {

    const rlIncidentTestData = Object.assign({
      type: 'realtime',
      components: ['cid_1'],
      'components_impact_status': 'partial_outage'
    }, incidentTestData);

    const rlIncidentUpdateTestData = Object.assign({}, incidentUpdateTestData, { status: 'resolved' });

    it ('should validate the object', function () {
      const data = Object.assign({}, rlIncidentTestData);
      data['updates'] = [ incidentUpdateTestData ];
      joiassert.equal(incident.schema, data, data);
    });

    it ('should validate the object with multiple updates', function () {

      const data = Object.assign({}, rlIncidentTestData);
      const anotherUpdate = Object.assign({}, incidentUpdateTestData, {id: 'IU345'});

      data['updates'] = [incidentUpdateTestData, anotherUpdate];

      joiassert.equal(incident.schema, data, data);

    });

    it ('should throw error for missing required values', function () {

      const reqFields = ['id', 'created_at', 'updated_at', 'name', 'type', 'components', 'is_resolved', 'components_impact_status', 'updates', 'latest_status'];
      const requiredErr = reqFields.map(f => `"${f}" is required`);

      joiassert.error(incident.schema, {}, requiredErr);

    });

    it ('should throw an error for when same incident update is added twice', function () {

      const data = Object.assign({}, rlIncidentTestData);
      const anotherUpdate = Object.assign({}, incidentUpdateTestData);

      data['updates'] = [incidentUpdateTestData, anotherUpdate];

      joiassert.error(incident.schema, data, '"updates" position 1 contains a duplicate value');

    });

    it ('should throw error if resolved_at is set if is_resolved is false', function () {

      const data = Object.assign({}, rlIncidentTestData);
      data.is_resolved = false;
      data['updates'] = [ incidentUpdateTestData ];

      joiassert.error(incident.schema, data, '"resolved_at" must be one of [null]');

    });

    it ('should throw error if resolved_at is not set if is_resolved is true', function () {

      const data = Object.assign({}, rlIncidentTestData);
      delete data.resolved_at;
      data['updates'] = [ incidentUpdateTestData ];

      joiassert.error(incident.schema, data, '"resolved_at" is required');

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

  describe ('type#backfilled', function () {

    const bfIncidentTestData = Object.assign({
      type: 'backfilled',
      'components_impact_status': 'partial_outage'
    }, incidentTestData, {
      latest_status: 'resolved'
    });

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

  describe ('type#scheduled', function () {

    const scIncidentTestData = Object.assign({}, incidentTestData, { 
      type: 'scheduled',
      scheduled_status: 'completed',
      scheduled_start_time: new Date(),
      scheduled_end_time: new Date(),
      scheduled_auto_status_updates: true,
      scheduled_auto_updates_send_notifications: true,
      components: ['cid_1'],
      latest_status: 'scheduled'
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

  it ('should return a prefix', function () {
    assert.strictEqual(incident.prefix, 'IC');
  });

});