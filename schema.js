const Joi = require("joi");

// Define listing schema
const listingSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  price: Joi.number().required().min(0),
  location: Joi.string().required(),
  country: Joi.string().required(),
  image: Joi.object({
    filename: Joi.string().optional(),
    url: Joi.string().optional(),
  }).optional(),  // Make image object optional
});

// Define review schema
// Choose one based on your actual request body structure

// Option 1: Nested "review" object
const reviewSchema = Joi.object({
  rating: Joi.number().required().min(1).max(5),
  comment: Joi.string().required(),
});

// Option 2: Direct `rating` and `comment` (if `req.body` is not nested under `review`)
// const reviewSchema = Joi.object({
//   rating: Joi.number().required().min(1).max(5),
//   comment: Joi.string().required(),
// });

module.exports = { listingSchema, reviewSchema };
