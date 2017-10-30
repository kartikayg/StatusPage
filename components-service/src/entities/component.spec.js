import {assert} from 'chai';
import joiassert from '../../test/joi-assert';

import component from './component';

import Joi from 'joi';

describe('entity/component', function() {

  it('should validate the object', function() {

    const data = {
      name: 'API',
      description: 'api',
      status: 'operational',
      sort_order: 3,
      active: true,
      group_id: 'CG-123'
    };

    joiassert.equal(component.schema, data, data);

  });

  it('should populate the default values', function() {

    const data = {
      name: 'API'
    };

    const expected = {
      name: 'API',
      status: 'operational',
      sort_order: 1,
      active: true
    };

    joiassert.equal(component.schema, data, expected);

  });

  it('should throw an error on invalid data', function() {

    joiassert.error(component.schema, {}, '"name" is required', {abortEarly: true});

    const data = {
      name: 'API-asdkasdnlkasdnlas-asdasdjasd-qqwqwsadasd',
      group_id: false,
      active: 'true',
      sort_order: 'error',
      status: 'not operational'
    };

    const expectedErrors = [
      '"name" length must be less than or equal to 32 characters long',
      '"status" must be one of [operational, degraded_performance, partial_outage, major_outage]',
      '"sort_order" must be a number',
      '"group_id" must be a string'
    ];

    joiassert.error(component.schema, data, expectedErrors);

  });

  it('should return a prefix', function() {
    assert.strictEqual(component.prefix, 'CM');
  });

});