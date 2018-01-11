/**
 * TESTING JOI OBJECT - the idea is to test that the rules set in JOI schema
 * are correct or not.
 */

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
      active: true
    };

    joiassert.equal(componentGroup.schema, data, data);

  });

  it ('should throw error for missing required values', function () {

    const reqFields = ['id', 'created_at', 'updated_at', 'name', 'active'];
    const requiredErr = reqFields.map(f => `"${f}" is required`);

    joiassert.error(componentGroup.schema, {}, requiredErr);

  });

  it('should return a prefix', function() {
    assert.strictEqual(componentGroup.prefix, 'CG');
  });

});