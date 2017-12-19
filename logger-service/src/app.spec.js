/**
 * These are integration tests and all the components are live (meaning no stubs).
 * There will be sending messages on the queue, logging in the file/console, etc.
 * All the resources are started  within docker container and will 
 * be handled by docker only.
 */

import {assert} from 'chai';
import MockDate from 'mockdate';
import * as testConsole from 'test-console';

import fs from 'fs';
import path from 'path';

import amqp from 'amqp';
import moment from 'moment';

import logger from './lib/logger/application';

describe('app - integration tests', function () {

  this.timeout(0);

  let messagingQueue;
  let exchange;

  const staticCurrentTime = new Date();

  // test logs folder and files
  const logFilesDir = path.join('/app', 'test', 'logfiles');
  const appLogFile = path.join(logFilesDir, `applog-${moment().format('YYYY-MM-DD')}.log`);
  const reqLogFile = path.join(logFilesDir, `requestlog-${moment().format('YYYY-MM-DD')}.log`);

  const getLastLine = (file) => {
    const lines = fs.readFileSync(file).toString().split('\n');
    return lines[lines.length - 2]; // -2 because there is an empty line at the end
  }

  before(function (done) {

    MockDate.set(staticCurrentTime);

    // delete all old log files
    const files = fs.readdirSync(logFilesDir);
    (files || []).forEach(f => {
      if (f.match(/.*.log/)) {
        fs.unlinkSync(path.join(logFilesDir, f));
      }
    });

    // create a logs exchange on the messaging queue
    messagingQueue = amqp.createConnection({url: process.env.RABBMITMQ_CONN_ENDPOINT});
    messagingQueue.on('ready', () => {
      exchange = messagingQueue.exchange('logs', { type: 'direct' });
      exchange.on('open', () => {

        // init the app
        require('./app').start();

        // a timer so the app can finish initializing
        setTimeout(() => {
          done();
        }, 3000);

      });
    });

  });

  after(function () {
    MockDate.reset();
    // disconnect queues
    messagingQueue.disconnect();
    require('./app').shutdown();

  });

  describe ('logger, with info level', function () {

    it ('should log message to console and file for logger() info call', function (done) {

      const inspect = testConsole.stdout.inspect();

      logger.info('hello kartikay');
      inspect.restore();

      // check for console
      assert.isAtLeast(inspect.output.length, 1); // one console

      assert.equal(inspect.output[inspect.output.length - 1], `[INFO:logger-service] - ${staticCurrentTime.toISOString()} hello kartikay \n`);

      // had to add a timeout b/c the file exists check wasn't working without it.
      setTimeout(() => {

        // check for file
        assert.isTrue(fs.existsSync(appLogFile), `the app log file (${appLogFile}) exisits`);

        const lastLine = JSON.parse(getLastLine(appLogFile));

        const expectedLine = {
          level: 'info',
          serviceName: process.env.SERVICE_NAME,
          message: 'hello kartikay',
          timestamp: staticCurrentTime.toISOString(),
          meta: {}
        };

        assert.deepEqual(lastLine, expectedLine);

        done();

      }, 1000);

    });

    it ('should log meta info to console and file for logger() call when meta is passed', function () {

      const inspect = testConsole.stdout.inspect();

      logger.warn('hello kartikay', {nickname: 'Kartik'});
      inspect.restore();

      // check for console
      assert.isAtLeast(inspect.output.length, 1); // one console

      assert.equal(inspect.output[inspect.output.length - 1], `[WARN:logger-service] - ${staticCurrentTime.toISOString()} hello kartikay {"nickname":"Kartik"}\n`);

      // check for file
      assert.isTrue(fs.existsSync(appLogFile));

      const lastLine = JSON.parse(getLastLine(appLogFile));

      const expectedLine = {
        level: 'warn',
        serviceName: process.env.SERVICE_NAME,
        message: 'hello kartikay',
        timestamp: staticCurrentTime.toISOString(),
        meta: {
          nickname: 'Kartik'
        }
      };

      assert.deepEqual(lastLine, expectedLine);

    });

    it ('should log error to console and file for logger() error call', function () {

      const inspect = testConsole.stderr.inspect();

      logger.error(new Error('test123'));
      inspect.restore();

      // check for console
      assert.isAtLeast(inspect.output.length, 1); // one console
      
      // its hard to check the exact error stack string, so doing a partial match
      assert.match(inspect.output[inspect.output.length - 1], /\[ERROR:logger-service\] - \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z test123 \n.*/);

      // check for file
      assert.isTrue(fs.existsSync(appLogFile));

      const lastLine = JSON.parse(getLastLine(appLogFile));

      assert.strictEqual(lastLine.level, 'error');
      assert.strictEqual(lastLine.serviceName, process.env.SERVICE_NAME);
      assert.strictEqual(lastLine.message, 'test123');
      assert.strictEqual(lastLine.timestamp, staticCurrentTime.toISOString());
      assert.strictEqual(lastLine.meta.code, 500);
      assert.strictEqual(lastLine.meta.name, 'Error');
      assert.strictEqual(lastLine.meta.isError, true);
      assert.isString(lastLine.meta.stack);

    });

    it ('should not log debug call as the level is info', function () {

      const inspect = testConsole.stdout.inspect();

      const message = 'hello kartikay';
      logger.debug(new Error('test123'));

      inspect.restore();
      assert.strictEqual(inspect.output.length, 0);

    });

  });

  describe ('messaging-queue', function () {

    it ('should log application log message when publish on logs queue', function (done) {

      const inspect = testConsole.stdout.inspect();

      const message = { level: 'info', message: 'hello kartikay', meta: { serviceName: 'components-service' } };
      exchange.publish('app', JSON.stringify(message));

      // wait for a second
      setTimeout(() => {

        inspect.restore();

        // check for console
        assert.isAtLeast(inspect.output.length, 1); // one console
        assert.equal(inspect.output[inspect.output.length - 1], `[INFO:components-service] - ${staticCurrentTime.toISOString()} hello kartikay \n`);

        // check for file
        assert.isTrue(fs.existsSync(appLogFile));

        const lastLine = JSON.parse(getLastLine(appLogFile));

        const expectedLine = {
          level: 'info',
          serviceName: 'components-service',
          message: 'hello kartikay',
          timestamp: staticCurrentTime.toISOString(),
          meta: {}
        };

        assert.deepEqual(lastLine, expectedLine);

        done();

      }, 1000);

    });

    it ('should log even if the log level is below what is the log level of the service', function (done) {

      const inspect = testConsole.stdout.inspect();

      const message = { level: 'debug', message: 'hello kartikay debug', meta: { serviceName: 'components-service' } };
      exchange.publish('app', JSON.stringify(message));

      // wait for a second
      setTimeout(() => {

        inspect.restore();

        // check for console
        assert.isAtLeast(inspect.output.length, 1);
        assert.equal(inspect.output[inspect.output.length - 1], `[DEBUG:components-service] - ${staticCurrentTime.toISOString()} hello kartikay debug \n`);

        const lastLine = JSON.parse(getLastLine(appLogFile));
        assert.isObject(lastLine);
        assert.strictEqual(lastLine.level, 'debug');

        done();

      }, 1000);

    });


    it ('should not log application log message if not an object', function (done) {

      const inspect = testConsole.stdout.inspect();

      const message = 'hello kartikay';
      exchange.publish('app', JSON.stringify(message));

      // wait for a second
      setTimeout(() => {

        inspect.restore();

        // check for console
        assert.strictEqual(inspect.output.length, 0);

        done();

      }, 1000);

    });

    it ('should log request log message when publish on logs queue', function (done) {

      const inspect = testConsole.stdout.inspect();

      const message = { 
        serviceName: 'components-service',
        method: 'GET',
        url: 'url',
        ip: 'ip',
        status: 'status',
        contentLength: 204,
        responseTime: '200 ms',
        timestamp: staticCurrentTime.toISOString()
      };

      exchange.publish('request', JSON.stringify(message));

      // wait for a second
      setTimeout(() => {

        inspect.restore();

        // check for console
        assert.isAtLeast(inspect.output.length, 1); // one console
        assert.equal(inspect.output[inspect.output.length - 1], `[HTTPREQUEST:components-service] - ${staticCurrentTime.toISOString()} GET url ip status 204 200 ms\n`);

        // check for file
        assert.isTrue(fs.existsSync(reqLogFile));

        const lastLine = JSON.parse(getLastLine(reqLogFile));
        assert.isObject(lastLine);
        assert.deepEqual(lastLine, Object.assign({}, message, {level: 'httprequest'}));

        done();

      }, 1000);

    });

    it ('should not log request log message if not an object', function (done) {

      const inspect = testConsole.stdout.inspect();

      const message = 'hello kartikay';
      exchange.publish('request', JSON.stringify(message));

      // wait for a second
      setTimeout(() => {

        inspect.restore();

        // check for console
        assert.strictEqual(inspect.output.length, 0);

        done();

      }, 1000);

    });

  });

});