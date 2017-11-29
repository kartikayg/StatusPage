/**
 * @fileoverview Model schema for an Incident
 */

import Joi from 'joi';

import incidentUpdate from './incident-update';

const schema = {
  id: Joi.string()
    .regex(/^IC.+$/)
    .required(),
  created_at: Joi.string()
    .regex(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/)
    .required(),
  updated_at: Joi.string()
    .regex(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/)
    .required(),
  name: Joi.string()
    .required(),
  components: Joi.array()
    .items(Joi.string())
    .unique()
    .default(null)
    .allow(null),
  resolved_at: Joi.string()
    .regex(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/)
    .default(null)
    .allow(null),
  updates: Joi.array()
    .required()
    .items(incidentUpdate.schema)
    .min(1)
    .unique('id')
    .unique((a, b) => {
      // the check here is that both updates don't have resolved status
      return (a.status === 'resolved' && b.status === 'resolved')
    })
};

const prefix = 'IC';

export default { schema, prefix };
