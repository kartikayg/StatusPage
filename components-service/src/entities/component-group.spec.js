import {assert} from 'chai';
import joiassert from '../../test/joi-assert';
import MockDate from 'mockdate';

import componentGroup from './component-group';

describe('entity/component-group', function() {

  const staticCurrentTime = new Date();

  before(function() {
    MockDate.set(staticCurrentTime);
  });

  after(function() {
    MockDate.reset();
  });

  it('should validate the object', function() {

    const data = {
      id: 'CG123',
      created_at: staticCurrentTime,
      updated_at: staticCurrentTime,
      name: 'API-Group',
      description: 'group',
      status: 'operational',
      sort_order: 3,
      active: true
    };

    joiassert.equal(componentGroup.schema, data, data);

  });

  it ('should throw error for missing required values', function () {

    const reqFields = ['id', 'created_at', 'updated_at', 'name', 'status', 'sort_order', 'active'];
    const requiredErr = reqFields.map(f => `"${f}" is required`);

    joiassert.error(componentGroup.schema, {}, requiredErr);

  });

  it('should throw an error on invalid data', function() {

    const data = {
      id: 'CG123',
      created_at: staticCurrentTime,
      updated_at: staticCurrentTime,
      name: 'API-group',
      active: 'true',
      sort_order: 'error',
      status: 'not operational'
    };

    const expectedErrors = [
      '"status" must be one of [operational, degraded_performance, partial_outage, major_outage]',
      '"sort_order" must be a number'
    ];

    joiassert.error(componentGroup.schema, data, expectedErrors);

  });

  it('should return a prefix', function() {
    assert.strictEqual(componentGroup.prefix, 'CG');
  });

});