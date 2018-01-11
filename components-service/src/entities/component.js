/**
 * @fileoverview Model schema for component
 */

import Joi from 'joi';

const schema = {

  id: Joi.string()
    .regex(/^CM.+$/)
    .required(),
  created_at: Joi.date()
    .iso()
    .required(),
  updated_at: Joi.date()
    .iso()
    .required(),

  name: Joi.string()
    .required()
    .max(32),
  description: Joi.string()
    .allow(null)
    .default(null),
  status: Joi.string()
    .only(['operational', 'degraded_performance', 'partial_outage', 'major_outage', 'maintenance'])
    .required(),
  sort_order: Joi.number()
    .integer()
    .required()
    .min(1),
  active: Joi.boolean()
    .required(),
  group_id: Joi.string()
    .regex(/^CG.+$/)
    .allow(null)
    .default(null)
};

const prefix = 'CM';

export default Object.create({ schema, prefix });
