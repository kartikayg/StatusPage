/**
 * @fileoverview Specific fields for scheduled incident type
 */

import Joi from 'joi';

import incidentUpdate from '../incident-update';

const schema = Joi.object({

  // scheduled incident related fields
  scheduled_status: Joi.string()
    .only(['scheduled', 'in_progress', 'completed', 'cancelled'])
    .required(),
  scheduled_start_time: Joi.date()
    .iso()
    .required(),
  scheduled_end_time: Joi.date()
    .iso()
    .required()
    .min(Joi.ref('scheduled_start_time')),
  scheduled_auto_status_updates: Joi.boolean()
    .required(),
  scheduled_auto_updates_send_notifications: Joi.boolean()
    .required(),

  // add incident updates
  updates: Joi.array()
    .required()
    .unique('id')
    .min(1)
    .items(Object.assign({}, incidentUpdate.schema, {
      status: Joi.string()
        .required()
        .only(['scheduled', 'in_progress', 'verifying', 'resolved', 'cancelled', 'update'])
    }))
    .unique((a, b) => a.status === 'resolved' && b.status === 'resolved') // eslint-disable-line arrow-body-style

});

export default { schema };
