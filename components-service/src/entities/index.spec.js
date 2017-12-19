import {assert} from 'chai';
import sinon from 'sinon';

import Joi from 'joi';

import * as entities from './index';

describe('entity/index', function() {

  it('should return all entities', function() {
    assert.isObject(entities.component);
    assert.isObject(entities.componentGroup);
  });

  it('should have the correct the entity type', function() {
    assert.strictEqual(entities.component.type, 'component');
    assert.strictEqual(entities.componentGroup.type, 'componentGroup');
  });

  it('should be able to generate an id', function() {
    assert.match(entities.component.generateId(), /^CM.+$/);
    assert.match(entities.componentGroup.generateId(), /^CG.+$/);
  });

  it('should use joi validate to validate the data', async function() {

    const validateStub = sinon.stub(Joi, 'validate').callsFake(() => {
      return {
        error: null,
        value: {}
      };
    });

    const res = await entities.component.validate({});
    
    sinon.assert.calledOnce(validateStub);

    validateStub.restore();

  });

  it('should throw error when invalid data', function(done) {

    const validateStub = sinon.spy(Joi, 'validate');

    entities.component.validate({})
      .catch(e => {

        sinon.assert.calledOnce(validateStub);
        validateStub.restore();

        assert.strictEqual(e.name, 'ValidationError');

        done();

      });

  });

});

