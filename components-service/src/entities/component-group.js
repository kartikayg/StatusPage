/**
 * @fileoverview Model schema for component-group
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
    .default(true)
};

const prefix = 'CG';

export default Object.create({ schema, prefix });
