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
    .only(['investigating', 'identified', 'monitoring', 'resolved'])
    .required(),
  displayed_at: Joi.string()
    .regex(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/)
    .required()
};

export default { schema, prefix };
