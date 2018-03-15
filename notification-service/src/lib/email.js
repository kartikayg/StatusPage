/**
 * @fileoverview Library to send emails out. It uses nodemailer
 * as the transporter and ejs for email templates.
 */

import nodemailer from 'nodemailer';
import EmailTemplate from 'email-templates';
import _cloneDeep from 'lodash/fp/cloneDeep';
import moment from 'moment';

import path from 'path';

import { conf } from '../config';


// {object} default transporter to be used to send the email
let _defaultTransporter;

/**
 * Returns the default transporter (SMTP)
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
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000
    });
  }

  return _defaultTransporter;

};

/**
 * Sends an email out.
 * @param {string} templateName - email template
 * @param {object} subscription - subscription object
 * @param {object} vars - variables for substitution in the email template
 * @param {string} from - from email address. If not provided, the system
 *  from email address is used
 * @param {object} transporter - transporter to send the email. if not provided,
 *  a default nodemailer SMTP transporter is used.
 * @return {promise}
 *  on success - response from sending the email
 *  on failure - error
 */
const send = async (templateName, subscription, vars, from, transporter) => {

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

  // prepare template vars
  const templateVars = Object.assign(_cloneDeep(vars || {}), {
    template: templateName,
    company_name: conf.email.COMPANY_NAME,
    ui_app_uri: conf.server.UI_APP_URI,
    unsub_uri: `${conf.server.UI_APP_URI}/manage_subscription/${subscription.id}`,
    date: moment().format('MMM DD, YYYY')
  });

  const response = await emailTpl.send({
    template: 'index',
    message: {
      to: subscription.email
    },
    locals: templateVars
  });

  return response;

};

export default { send };
