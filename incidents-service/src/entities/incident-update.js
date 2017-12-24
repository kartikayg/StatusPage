/**
 * @fileoverview Model schema for an Incident update
 */

import htmlInput from 'joi-html-input';
import Joi from 'joi';

const htmlJoi = Joi.extend(htmlInput);

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
    .iso(),

  do_notify_subscribers: Joi.boolean()

};

export default { schema, prefix };
