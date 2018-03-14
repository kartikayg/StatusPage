/**
 * Note: THIS TEST WILL SEND OUT EMAILS IF A PROPER STMP SERVER IS SETUP.
 */

import { assert } from 'chai';

import config from '../config';
import { send as sendEmail } from './email';

describe('lib/email', function () {

  before(function() {
    config.load(process.env);
  });

  after(function() {
    config.reset();
  });

  it ('should send the email with json transport', async function () {

    const r = await sendEmail('test', { email: 'kartikayg@gmail.com' }, { name: 'Kartik' }, undefined, {
      jsonTransport: true,
      logger: true
    });

    assert.isString(r.messageId);

  });

  it ('should send the email with email transport', async function () {

    const r = await sendEmail('test', { email: 'kartikayg@gmail.com' }, { name: 'Kartik' });

    assert.isString(r.messageId);
    assert.equal(r.envelope.from, config.conf.email.SYSTEM_EMAIL_FROM_ADDRESS);
    assert.deepEqual(r.rejected, []); // no rejections

  });


});