import {assert} from 'chai';
import sinon from 'sinon';

import Joi from 'joi';

import * as entities from './index';

describe('entity/index', function() {

  it('should return all entities', function() {
    assert.isObject(entities.incident);
    assert.isObject(entities.incidentUpdate);
  });

  it('should have the correct the entity type', function() {
    assert.strictEqual(entities.incident.type, 'incident');
    assert.strictEqual(entities.incidentUpdate.type, 'incidentUpdate');
  });

  it('should be able to generate an id', function() {
    assert.match(entities.incident.generateId(), /^IC.+$/);
    assert.match(entities.incidentUpdate.generateId(), /^IU.+$/);
  });

  it('should be able to validate the data', async function() {

    // const validateStub = sinon.spy(Joi, 'validate');
    
    // const data = { name: 'test' };
    // const res = await entities.component.validate(data);
    
    // sinon.assert.calledOnce(validateStub);
    // assert.isObject(res);

    // validateStub.restore();

  });

  it('should throw error when invalid data', function(done) {

    // const validateStub = sinon.spy(Joi, 'validate');

    // entities.component.validate({})
    //   .catch(e => {

    //     sinon.assert.calledOnce(validateStub);
    //     validateStub.restore();

    //     assert.strictEqual(e.name, 'ValidationError');

    //     done();

    //   });

    done();

  });

});

