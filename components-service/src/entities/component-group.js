/**
 * @fileoverview Model schema for component-group
 */

import Joi from 'joi';

const schema = {

  id: Joi.string()
    .regex(/^CG.+$/)
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
    .allow(null),
  status: Joi.string()
    .only(['operational', 'degraded_performance', 'partial_outage', 'major_outage'])
    .required(),
  sort_order: Joi.number()
    .integer()
    .required()
    .min(1),
  active: Joi.boolean()
    .required()

};

const prefix = 'CG';

export default Object.create({ schema, prefix });
