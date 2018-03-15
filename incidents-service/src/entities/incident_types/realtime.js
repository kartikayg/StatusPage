/**
 * @fileoverview Specific fields for realtime incident type
 */

import Joi from 'joi';

import incidentUpdate from '../incident-update';

const schema = Joi.object({

  components: Joi.array()
    .required(),

  // the highest status from all of the impacted components.
  // this kind of defines the impact status of this incident.
  components_impact_status: Joi.string()
    .only(['operational', 'maintenance', 'degraded_performance', 'partial_outage', 'major_outage'])
    .required(),

  // add incident updates
  updates: Joi.array()
    .required()
    .unique('id')
    .min(1)
    .items(Object.assign({}, incidentUpdate.schema, {
      status: Joi.string()
        .required()
        .only(['investigating', 'identified', 'monitoring', 'resolved', 'update'])
    }))
    .unique((a, b) => a.status === 'resolved' && b.status === 'resolved'), // eslint-disable-line arrow-body-style

  latest_status: Joi.string()
    .required()
    .only(['investigating', 'identified', 'monitoring', 'resolved'])

});

export default { schema };
