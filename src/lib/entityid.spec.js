import {assert} from 'chai';

import entityId from './entityid';

describe('lib/entityid', function() {

  it('should return an id with prefix', function() {
    
    const id = entityId.generate('CG');

    assert.isString(id);
    assert.match(id, /^CG\-.+$/);

  });

  it('should return an id with no prefix', function() {

    const id = entityId.generate();
    assert.isString(id);
    
  });

});