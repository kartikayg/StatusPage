/**
 * @fileoverview
 */

import nodemailer from 'nodemailer';
import EmailTemplate from 'email-templates';
import cloneDeep from 'lodash/fp/cloneDeep';

import path from 'path';

import { conf } from '../config';


// {object} default transporter to be used to send the email
let _defaultTransporter;

/**
 * Returns the default transporter
 * @param {boolean} forceNew. if true, always creates a
 *   new transporter
 * @return {object}
 */
const getDefaultTransporter = (forceNew = false) => {

  if (!_defaultTransporter || forceNew === true) {
    _defaultTransporter = nodemailer.createTransport({
      host: conf.email.SMTP_HOST_NAME,
      port: conf.email.SMTP_PORT,
      auth: {
        user: conf.email.SMTP_USERNAME,
        pass: conf.email.SMTP_PASSWORD
      }
    });
  }

  return _defaultTransporter;

};

/**
 * Sends an email out.
 * @param {string} template - email template
 * @param {string|array} to - to email address(es)
 * @param {object} vars - variables for substitution in the email template
 * @param {string} from - from email address. If not provided, the system
 *  from email address is used
 * @param {object} transporter - transporter to send the email. if not provided,
 *  a default nodemailer SMTP transporter is used.
 * @return {promise}
 *  on success - response from sending the email
 *  on failure - error
 */
const send = async (template, to, vars, from, transporter) => {

  // email template object. use passed variables or from env conf
  const emailTpl = new EmailTemplate({
    message: {
      from: from || conf.email.SYSTEM_EMAIL_FROM_ADDRESS
    },
    send: true,
    transport: transporter || getDefaultTransporter(),
    views: {
      root: path.resolve('src/email_templates'),
      options: {
        extension: 'ejs'
      }
    }
  });

  const response = await emailTpl.send({
    template,
    message: {
      to: to.toString() // if an array, this will convert it to a string
    },
    locals: cloneDeep(vars || {}) // in case the package is modifying the data
  });

  return response;

};

export default { send };
