import {assert} from 'chai';

import * as sanitize from './sanitize';

describe('server/middleware/sanitize', function() {

  it ('remove white space', function() {

    const req = { body: { name: ' test ' } };
    sanitize.request()(req, {}, () => {});

    assert.strictEqual(req.sanitizedBody.name, 'test');

  });

  it ('empty string to null', function() {

    const req = { body: { name: '   ', description: 'test', sort_order: 2 } };
    sanitize.request()(req, {}, () => {});

    assert.deepEqual(req.sanitizedBody, { name: null, description: 'test', sort_order: 2 } );

  });

  it ('remove tags', function() {

    const req = { body: { name: ' <script>doc.load</script> hello "world ', arr: [' <a>t</a> test '] } };
    sanitize.request()(req, {}, () => {});

    assert.strictEqual(req.sanitizedBody.name, 'doc.load hello "world');
    assert.strictEqual(req.sanitizedBody.arr[0], 't test');

  });

  it ('sanitizes body & query', function() {

    const req = { body: { name: 'test' },  query: { key: 'value' } };
    sanitize.request()(req, {}, () => {});

    assert.deepEqual(req.sanitizedBody, {name: 'test'});
    assert.deepEqual(req.sanitizedQuery, {key: 'value'});

  });

  it ('sanitizes params', function() {

    const req = { params: { name: ' test ' } };
    sanitize.params()(req, {}, () => {});

    assert.deepEqual(req.sanitizedParams, {name: 'test'});

  });

});