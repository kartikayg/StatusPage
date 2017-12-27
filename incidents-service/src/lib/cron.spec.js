/**
 * Test cron tab functionality
 */

import {assert} from 'chai';
import sinon from 'sinon';
import * as testConsole from 'test-console';

import cron from './cron';

describe ('lib/cron', function () {

  beforeEach(function(done) {
    setTimeout(done, 1000);
  });

  afterEach(function() {
    cron.stopAll();
  });

  it ('should add a function to run on cron every second', function (done) {

    this.timeout(10000);

    // we can use the console.log and see its being 

    const inspect = testConsole.stdout.inspect();

    const j = cron.addJob('* * * * * *', () => {
      console.log('testing cron output on to the console');
    });


    // printing every second, so in 4 seconds at least 3 output 
    // should be there
    setTimeout(() => {
      assert.isTrue(inspect.output.includes('testing cron output on to the console\n'));
      assert.isAtLeast(inspect.output.length, 3);
      inspect.restore();
      done();
    }, 4000);

  });

});