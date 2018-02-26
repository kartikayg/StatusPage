/**
 * @fileoverview Specific fields for backfilled incident type
 */

import Joi from 'joi';

import incidentUpdate from '../incident-update';

const schema = Joi.object({

  components: Joi.array()
    .allow(null)
    .min(0),

  // the highest status from all of the impacted components.
  // this kind of defines the impact status of this incident.
  components_impact_status: Joi.string()
    .only(['operational', 'maintenance', 'degraded_performance', 'partial_outage', 'major_outage'])
    .required(),

  // add incident updates
  updates: Joi.array()
    .required()
    .length(1)
    .items(Object.assign({}, incidentUpdate.schema, {
      status: Joi.string()
        .required()
        .only(['resolved'])
    }))

});

export default { schema };
