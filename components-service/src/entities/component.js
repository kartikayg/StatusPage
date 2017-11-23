/**
 * @fileoverview Model schema for component
 */

import Joi from 'joi';

const schema = {
  name: Joi.string()
    .required()
    .max(32),
  description: Joi.string()
    .default(null)
    .allow(null),
  status: Joi.string()
    .only(['operational', 'degraded_performance', 'partial_outage', 'major_outage'])
    .default('operational'),
  sort_order: Joi.number()
    .integer()
    .min(1)
    .default(1),
  active: Joi.boolean()
    .default(true),
  group_id: Joi.string()
    .default(null)
    .allow(null)
};

const prefix = 'CM';

export default Object.create({ schema, prefix });
