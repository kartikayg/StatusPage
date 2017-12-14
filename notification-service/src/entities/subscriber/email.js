/**
 * @fileoverview Model schema for a email subscriber type
 */

import Joi from 'joi';

const schema = Joi.object({
  email: Joi.string()
    .required()
    .email()
});

export default { schema };
