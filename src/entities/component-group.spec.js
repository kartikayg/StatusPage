import {assert} from 'chai';
import joiassert from '../../test/joi-assert';

import componentgroup from './component-group';

describe('models/component-group', function() {

  it('should validate the object', function() {

    const data = {
      name: 'API-Group',
      description: 'group',
      status: 'operational',
      sort_order: 3,
      is_active: true,
    };

    joiassert.equal(componentgroup.schema, data, data);

  });

  it('should populate the default values', function() {

     const data = {
      name: 'API-Group'
    };

    const expected = {
      name: 'API-Group',
      status: 'operational',
      sort_order: 0,
      is_active: true
    };

    joiassert.equal(componentgroup.schema, data, expected);

  });

  it('should throw an error on invalid data', function() {

    joiassert.error(componentgroup.schema, {}, '"name" is required', { abortEarly: true });

    const data = {
      name: 'API-asdkasdnlkasdnlas-asdasdjasd-qqwqwsadasd',
      is_active: 'true',
      sort_order: 'error',
      status: 'not operational'
    };

    const expectedErrors = [
      '"name" length must be less than or equal to 32 characters long',
      '"status" must be one of [operational, degraded_performance, partial_outage, major_outage]',
      '"sort_order" must be a number'
    ];

    joiassert.error(componentgroup.schema, data, expectedErrors);

  });

  it('should return a prefix', function() {
    assert.strictEqual(componentgroup.prefix, 'CG');
  });

});