/**
 * @fileoverview Model schema for a subscriber type
 */

import Joi from 'joi';

import { schema as emailSchema } from './subscriber/email';
import { schema as webhookSchema } from './subscriber/webhook';

import { validTypes } from '../repositories/subscription';

// returns the current date & time
const currentTime = () => {
  return new Date();
};

const prefix = 'SB';

const schema = Joi.object({
  id: Joi.string()
    .regex(/^SB.+$/)
    .required(),
  created_at: Joi.date()
    .iso()
    .default(currentTime, 'current time'),
  updated_at: Joi.date()
    .iso()
    .default(currentTime, 'current time'),

  type: Joi.string()
    .only(validTypes)
    .required(),

  is_confirmed: Joi.boolean()
    .default(false),

  components: Joi.array()
    .items(Joi.string())
    .unique()
    .default([])

})
  .when(Joi.object({ type: Joi.string().only('email') }).unknown(), {
    then: emailSchema
  })
  .when(Joi.object({ type: Joi.string().only('webhook') }).unknown(), {
    then: webhookSchema
  });


export default { schema, prefix };
