/**
 * @fileoverview Model schema for an Incident update
 */

import htmlInput from 'joi-html-input';
import Joi from 'joi';

const htmlJoi = Joi.extend(htmlInput);

// returns the current date & time
const currentTime = () => {
  return (new Date()).toISOString();
};

const prefix = 'IU';

const schema = {
  id: Joi.string()
    .regex(/^IU.+$/)
    .required(),
  created_at: Joi.string()
    .regex(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/)
    .required(),
  updated_at: Joi.string()
    .regex(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/)
    .required(),

  message: htmlJoi.htmlInput()
    .allowedTags()
    .required(),
  status: Joi.string()
    .required(),
  displayed_at: Joi.string()
    .regex(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/)
    .default(currentTime, 'the current date and time'),

  do_twitter_update: Joi.boolean()
    .default(false),
  do_notify_subscribers: Joi.boolean()
    .default(false)

};

export default { schema, prefix };
