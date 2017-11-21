/**
 * this test will behave more like an integeration test
 */

import {assert} from 'chai';
import fs from 'fs';
import path from 'path';

import amqp from 'amqp';
import moment from 'moment';
import * as testConsole from 'test-console';

import logger from './lib/logger/application';

describe('app - integration tests', function () {

  let messagingQueue;
  let exchange;

  const logFilesDir = path.join('/app', 'test', 'logfiles');
  const appLogFile = path.join(logFilesDir, `applog-${moment().format('YYYY-MM-DD')}.log`);
  const reqLogFile = path.join(logFilesDir, `requestlog-${moment().format('YYYY-MM-DD')}.log`);

  const getLastLine = (file) => {
    const lines = fs.readFileSync(file).toString().split('\n');
    return lines[lines.length - 2]; // -2 because there is an empty line at the end
  }

  before(function (done) {

    this.timeout(6000);

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

    // disconnect queues
    messagingQueue.disconnect();
    require('./app').stop();

  });

  describe ('logger', function () {

    it ('should log message to console and file for logger() info call', function () {

      const inspect = testConsole.stdout.inspect();

      logger.info('hello kartikay');
      inspect.restore();

      // check for console
      assert.strictEqual(inspect.output.length, 1); // one console
      assert.match(inspect.output[0], /\[INFO:logger-service\] - \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z hello kartikay \n/);

      // check for file
      assert.isTrue(fs.existsSync(appLogFile));

      const lastLine = JSON.parse(getLastLine(appLogFile));
      assert.isObject(lastLine);

      assert.strictEqual(lastLine.level, 'info');
      assert.strictEqual(lastLine.serviceName, 'logger-service');
      assert.strictEqual(lastLine.message, 'hello kartikay');
      assert.match(lastLine.timestamp, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/);

    });

    it ('should log meta info to console and file for logger() call when meta is passed', function () {

      const inspect = testConsole.stdout.inspect();

      logger.warn('hello kartikay', {nickname: 'Kartik'});
      inspect.restore();

      // check for console
      assert.strictEqual(inspect.output.length, 1); // one console
      assert.match(inspect.output[0], /\[WARN:logger-service\] - \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z hello kartikay {"nickname":"Kartik"}\n/);

      // check for file
      assert.isTrue(fs.existsSync(appLogFile));

      const lastLine = JSON.parse(getLastLine(appLogFile));
      assert.isObject(lastLine);

      assert.strictEqual(lastLine.level, 'warn');
      assert.strictEqual(lastLine.serviceName, 'logger-service');
      assert.strictEqual(lastLine.message, 'hello kartikay');
      assert.match(lastLine.timestamp, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/);
      assert.deepEqual(lastLine.meta, {nickname: 'Kartik'});

    });

    it ('should log error to console and file for logger() error call', function () {

      const inspect = testConsole.stderr.inspect();

      logger.error(new Error('test123'));
      inspect.restore();

      // check for console
      assert.strictEqual(inspect.output.length, 1); // one console
      
      // its hard to check the exact string, so doing a partial match
      assert.match(inspect.output[0], /\[ERROR:logger-service\] - \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z test123 \n.*/);

      // check for file
      assert.isTrue(fs.existsSync(appLogFile));

      const lastLine = JSON.parse(getLastLine(appLogFile));
      assert.isObject(lastLine);

      assert.strictEqual(lastLine.level, 'error');
      assert.strictEqual(lastLine.serviceName, 'logger-service');
      assert.strictEqual(lastLine.message, 'test123');
      assert.match(lastLine.timestamp, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/);
      assert.strictEqual(lastLine.meta.code, 500);
      assert.strictEqual(lastLine.meta.name, 'Error');
      assert.strictEqual(lastLine.meta.isError, true);
      assert.isString(lastLine.meta.stack);

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
        assert.strictEqual(inspect.output.length, 1); // one console
        assert.match(inspect.output[0], /\[INFO:components-service\] - \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z hello kartikay \n/);

        // check for file
        assert.isTrue(fs.existsSync(appLogFile));

        const lastLine = JSON.parse(getLastLine(appLogFile));
        assert.isObject(lastLine);

        assert.strictEqual(lastLine.level, 'info');
        assert.strictEqual(lastLine.serviceName, 'components-service');
        assert.strictEqual(lastLine.message, 'hello kartikay');
        assert.match(lastLine.timestamp, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/);

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
        timestamp: (new Date()).toISOString()
      };

      exchange.publish('request', JSON.stringify(message));

      // wait for a second
      setTimeout(() => {

        inspect.restore();

        // check for console
        assert.strictEqual(inspect.output.length, 1); // one console
        assert.match(inspect.output[0], /\[HTTPREQUEST:components-service\] - \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z GET url ip status 204 200 ms\n/);

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