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

    const r = await sendEmail('test', 'kartikayg@gmail.com', { name: 'Kartik' }, undefined, {
      jsonTransport: true,
      logger: true
    });

  });

});