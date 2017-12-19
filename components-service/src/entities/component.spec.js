import {assert} from 'chai';
import joiassert from '../../test/joi-assert';
import MockDate from 'mockdate';

import component from './component';

import Joi from 'joi';

describe('entity/component', function() {

  const staticCurrentTime = new Date();

  before(function() {
    MockDate.set(staticCurrentTime);
  });

  after(function() {
    MockDate.reset();
  });

  it ('should validate the object', function () {

    const data = {
      id: 'CM123',
      created_at: staticCurrentTime,
      updated_at: staticCurrentTime,
      name: 'API',
      description: 'api',
      status: 'operational',
      sort_order: 3,
      active: true,
      group_id: 'CG-123'
    };

    joiassert.equal(component.schema, data, data);

  });

  it ('should throw error for missing required values', function () {

    const reqFields = ['id', 'created_at', 'updated_at', 'name', 'status', 'sort_order', 'active'];
    const requiredErr = reqFields.map(f => `"${f}" is required`);

    joiassert.error(component.schema, {}, requiredErr);

  });


  it ('should throw an error on invalid data', function () {

    const data = {
      id: 'CM123',
      name: 'API',
      active: 'true',
      sort_order: 'error',
      status: 'not operational',
      created_at: staticCurrentTime,
      updated_at: staticCurrentTime,
    };

    const expectedErrors = [
      '"status" must be one of [operational, degraded_performance, partial_outage, major_outage]',
      '"sort_order" must be a number'
    ];

    joiassert.error(component.schema, data, expectedErrors);

  });

  it('should return a prefix', function() {
    assert.strictEqual(component.prefix, 'CM');
  });

});