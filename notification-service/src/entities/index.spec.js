import {assert} from 'chai';
import sinon from 'sinon';

import Joi from 'joi';

import * as entities from './index';

describe('entity/index', function() {

  it('should return all entities', function() {
    assert.isObject(entities.subscriber);
  });

  it('should have the correct the entity type', function() {
    assert.strictEqual(entities.subscriber.type, 'subscriber');
  });

  it('should be able to generate an id', function() {
    assert.match(entities.subscriber.generateId(), /^SB.+$/);
  });

  it('should throw error when invalid data', function(done) {

    const validateStub = sinon.spy(Joi, 'validate');

    entities.subscriber.validate({})
      .catch(e => {

        sinon.assert.calledOnce(validateStub);
        validateStub.restore();

        assert.strictEqual(e.name, 'ValidationError');

        done();

      });

  });

});

