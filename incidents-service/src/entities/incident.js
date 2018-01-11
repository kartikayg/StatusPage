/**
 * @fileoverview Model schema for an Incident
 */

import Joi from 'joi';

import { schema as scheduledSchema } from './incident_types/scheduled';
import { schema as realtimeSchema } from './incident_types/realtime';
import { schema as backfilledSchema } from './incident_types/backfilled';

const schema = Joi.object({
  id: Joi.string()
    .regex(/^IC.+$/)
    .required(),
  created_at: Joi.date()
    .iso()
    .required(),
  updated_at: Joi.date()
    .iso()
    .required(),

  name: Joi.string()
    .required(),
  type: Joi.string()
    .required()
    .only(['realtime', 'scheduled', 'backfilled']),
  components: Joi.array()
    .items(Joi.string())
    .unique(),
  is_resolved: Joi.boolean()
    .required(),
  resolved_at: Joi.date()
    .iso()
    .when('is_resolved', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.date().only(null)
    })
})

// add fields based on incident types

  .when(Joi.object({ type: Joi.string().only('realtime') }).unknown(), {
    then: realtimeSchema
  })
  .when(Joi.object({ type: Joi.string().only('scheduled') }).unknown(), {
    then: scheduledSchema
  })
  .when(Joi.object({ type: Joi.string().only('backfilled') }).unknown(), {
    then: backfilledSchema
  });

const prefix = 'IC';

export default { schema, prefix };
