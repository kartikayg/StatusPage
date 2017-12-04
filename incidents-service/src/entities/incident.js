/**
 * @fileoverview Model schema for an Incident
 */

import Joi from 'joi';

import incidentUpdate from './incident-update';

const schema = {

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
    .unique()
    .default(null)
    .allow(null),
  is_resolved: Joi.boolean()
    .default(false),
  resolved_at: Joi.date()
    .iso()
    .when('is_resolved', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.date()
        .default(null)
        .only(null)
    }),

  // scheduled incident related fields
  scheduled_status: Joi.string()
    .only(['scheduled', 'in_progress', 'completed', 'cancelled'])
    .when('type', {
      is: 'scheduled',
      then: Joi.string().default('scheduled'),
      otherwise: Joi.string().forbidden()
    }),
  scheduled_start_time: Joi.date()
    .iso()
    .when('type', {
      is: 'scheduled',
      then: Joi.required(),
      otherwise: Joi.date().forbidden()
    }),
  scheduled_end_time: Joi.date()
    .iso()
    .when('type', {
      is: 'scheduled',
      then: Joi.required(),
      otherwise: Joi.date().forbidden()
    }),
  scheduled_auto_status_updates: Joi.boolean()
    .when('type', {
      is: 'scheduled',
      then: Joi.boolean().required().default(false),
      otherwise: Joi.boolean().forbidden()
    }),
  scheduled_auto_updates_send_notifications: Joi.boolean()
    .when('type', {
      is: 'scheduled',
      then: Joi.boolean().required().default(false),
      otherwise: Joi.boolean().forbidden()
    }),


  // incident updates.
  updates: Joi.array()
    .required()
    .unique('id')

    // based on the type, set some of the rules
    .when('type', {
      is: 'backfilled',
      then: Joi.array()
        .length(1)
        .items(Object.assign(
          {},
          incidentUpdate.schema,
          { status: Joi.string().required().only('resolved') }
        ))
    })
    .when('type', {
      is: 'realtime',
      then: Joi.array()
        .min(1)
        .items(Object.assign(
          {},
          incidentUpdate.schema,
          {
            status: Joi.string()
              .required()
              .only(['investigating', 'identified', 'monitoring', 'resolved', 'update'])
          }
        ))
        .unique((a, b) => a.status === 'resolved' && b.status === 'resolved') // eslint-disable-line arrow-body-style
    })
    .when('type', {
      is: 'scheduled',
      then: Joi.array()
        .min(1)
        .items(Object.assign(
          {},
          incidentUpdate.schema,
          {
            status: Joi.string()
              .required()
              .only(['scheduled', 'in_progress', 'verifying', 'resolved', 'cancelled', 'update'])
          }
        ))
        .unique((a, b) => a.status === 'resolved' && b.status === 'resolved') // eslint-disable-line arrow-body-style
    })
};

const prefix = 'IC';

export default { schema, prefix };
