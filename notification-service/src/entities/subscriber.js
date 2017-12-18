/**
 * @fileoverview Model schema for a subscriber type
 */

import Joi from 'joi';

import { schema as emailSchema } from './subscriber/email';
import { schema as webhookSchema } from './subscriber/webhook';

import { validTypes } from '../repositories/subscription';

const prefix = 'SB';

const schema = Joi.object({
  id: Joi.string()
    .regex(/^SB.+$/)
    .required(),
  created_at: Joi.date()
    .iso()
    .required(),
  updated_at: Joi.date()
    .iso()
    .required(),

  type: Joi.string()
    .only(validTypes)
    .required(),

  is_confirmed: Joi.boolean()
    .required(),

  components: Joi.array()
    .items(Joi.string())
    .unique()
    .required()

})
  .when(Joi.object({ type: Joi.string().only('email') }).unknown(), {
    then: emailSchema
  })
  .when(Joi.object({ type: Joi.string().only('webhook') }).unknown(), {
    then: webhookSchema
  });


export default { schema, prefix };
