/**
 * @fileoverview Specific fields for backfilled incident type
 */

import Joi from 'joi';

import incidentUpdate from '../incident-update';

const schema = Joi.object({

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
