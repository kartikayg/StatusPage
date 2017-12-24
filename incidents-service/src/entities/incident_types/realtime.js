/**
 * @fileoverview Specific fields for realtime incident type
 */

import Joi from 'joi';

import incidentUpdate from '../incident-update';

const schema = Joi.object({

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
    .unique((a, b) => a.status === 'resolved' && b.status === 'resolved') // eslint-disable-line arrow-body-style

});

export default { schema };
