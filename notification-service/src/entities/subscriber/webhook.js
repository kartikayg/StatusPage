/**
 * @fileoverview Model schema for a webhook subscriber type
 */

import Joi from 'joi';

const schema = Joi.object({
  uri: Joi.string()
    .uri({
      schema: ['http', 'https']
    })
    .required()
});

export default { schema };
