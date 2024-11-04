const joi = require("joi");

const listingSchema = joi.object({
  title: joi.string().required(),
  description: joi.string().required(),
  price: joi.number().required().min(0),
  location: joi.string().required(),
  country: joi.string().required(),
  image: joi.object({
    filename: joi.string(),
    url: joi.string(),
  }),
});

module.exports = { listingSchema };
