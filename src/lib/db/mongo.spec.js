import {assert} from 'chai';
import sinon from 'sinon';

import mongodb from './mongo';

describe('lib/db/mongo', function() {

  it('should return a db connection', async function() {

    const db = await mongodb.connect({
      MONGO_ENDPOINT: 'mongodb://db/componentservice'
    });

    assert.isObject(db);
    assert.equal(db.databaseName, 'componentservice');

    db.close();

  });

  it('should throw Error exception if invalid mongo connection string', function(done) {
    
    mongodb.connect({MONGO_ENDPOINT: 'invalid_url'})
      .catch(e => {
        assert.equal(e.name, 'Error');
        done();
      });

  });

  it('should throw MongoError exception if invalid mongo connection string', function(done) {
    
    mongodb.connect({MONGO_ENDPOINT: 'mongodb://invalid/123'})
      .catch(e => {
        assert.equal(e.name, 'MongoError');
        done();
      });

  });

});