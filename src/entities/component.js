/**
 * @fileoverview Model schema for component
 */

import Joi from 'joi';

const schema = {
  name: Joi.string()
    .required()
    .max(32),
  description: Joi.string(),
  status: Joi.string()
    .only(['operational', 'degraded_performance', 'partial_outage', 'major_outage'])
    .default('operational'),
  sort_order: Joi.number()
    .integer()
    .min(0)
    .default(0),
  is_active: Joi.boolean()
    .default(true),
  group_id: Joi.string()
};

const prefix = 'CM';

export default Object.create({ schema, prefix });
