import {assert} from 'chai';
import sinon from 'sinon';

import dbAdapter from './db';

describe('lib/db', function() {

  it('should return a db connection', async function() {

    const db = await dbAdapter.connect({
      mongo_url: 'mongodb://db/componentservice'
    });

    assert.isObject(db);
    assert.equal(db.databaseName, 'componentservice');

    db.close();

  });

  it('should throw Error exception if invalid mongo connection string', function(done) {
    
    dbAdapter.connect({mongo_url: 'invalid_url'})
      .catch(e => {
        assert.equal(e.name, 'Error');
        done();
      });

  });

  it('should throw MongoError exception if invalid mongo connection string', function(done) {
    
    dbAdapter.connect({mongo_url: 'mongodb://invalid/123'})
      .catch(e => {
        assert.equal(e.name, 'MongoError');
        done();
      });

  });

});