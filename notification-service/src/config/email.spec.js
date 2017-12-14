import {assert} from 'chai';
import joiassert from '../../test/joi-assert';

import { schema } from './email';

describe('config/email', function() {

  describe('schema', function() {

    const data = {
      SMTP_HOST_NAME: 'smtp.mailtrap.io',
      SMTP_PORT: 1234,
      SMTP_USERNAME: 'username',
      SMTP_PASSWORD: 'password',
      SYSTEM_EMAIL_FROM_ADDRESS: 'admin@site.com'
    };

    it('should return a joi object', function() {
      assert.isObject(schema);
    });

    it('should validate the conf object', function() {
      joiassert.equal(schema, data, data);
    });


    it ('should throw error for missing required values', function () {

      const requiredErr = [
        '"SMTP_HOST_NAME" is required',
        '"SMTP_PORT" is required',
        '"SMTP_USERNAME" is required',
        '"SMTP_PASSWORD" is required',
        '"SYSTEM_EMAIL_FROM_ADDRESS" is required'
      ];

      joiassert.error(schema, {}, requiredErr);

    });

    it ('should throw error for invalid values', function () {

      const data = {
        SMTP_HOST_NAME: 'smtp.mailtrap.io',
        SMTP_PORT: 1234,
        SMTP_USERNAME: 'username',
        SMTP_PASSWORD: 'password',
        SYSTEM_EMAIL_FROM_ADDRESS: 'admin'
      };

      const invalidValuesErr = [
        '"SYSTEM_EMAIL_FROM_ADDRESS" must be a valid email'
      ];

      joiassert.error(schema, data, invalidValuesErr);

    });

  });

});