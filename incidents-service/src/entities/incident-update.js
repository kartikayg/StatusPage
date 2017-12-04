/**
 * @fileoverview Model schema for an Incident update
 */

import htmlInput from 'joi-html-input';
import Joi from 'joi';

const htmlJoi = Joi.extend(htmlInput);

// returns the current date & time
const currentTime = () => {
  return new Date();
};

const prefix = 'IU';

const schema = {
  id: Joi.string()
    .regex(/^IU.+$/)
    .required(),
  created_at: Joi.date()
    .iso()
    .required(),
  updated_at: Joi.date()
    .iso()
    .required(),

  message: htmlJoi.htmlInput()
    .allowedTags()
    .trim()
    .required(),
  status: Joi.string()
    .required(),
  displayed_at: Joi.date()
    .iso()
    .default(currentTime, 'the current date and time'),

  do_twitter_update: Joi.boolean()
    .default(false),
  do_notify_subscribers: Joi.boolean()
    .default(false)

};

export default { schema, prefix };
