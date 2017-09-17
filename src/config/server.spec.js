import {assert} from 'chai';
import server from './server';

describe('config/server', function() {  
  
  // default env variables
  const envVars = {
    PORT: 1234
  };

  it('throws exception when no port is defined', function() {
    assert.throws(() => server.load(), Error, /"PORT" is required/);
  });

  it('should return a proper object on success', function() {

    const conf = server.load(envVars);

    assert.typeOf(conf, 'object');
    assert.typeOf(conf.server, 'object');

  });

  it('should return the correct PORT number', function() {
    const conf = server.load(envVars);
    assert.strictEqual(conf.server.port, envVars.PORT);
  });

  it('should ignore extra vars', function() {
    
    const extraVars = Object.assign({extra: 123}, envVars);

    const conf = server.load(extraVars);

    assert.typeOf(conf, 'object');
    assert.typeOf(conf.server, 'object');
    assert.strictEqual(conf.server.port, envVars.PORT);   

  });

});