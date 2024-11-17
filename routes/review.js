// routes/reviews.js

const express = require("express");
const router = express.Router({ mergeParams: true }); // Allows access to parent route parameters (e.g., `:id` for listings)
const Listing = require("../models/listing");
const Reviews = require("../models/review");
const { reviewSchema } = require("../schema.js");
const { isLoggedIn } = require("../middleware");

// Middleware to validate review
const validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body); // Directly validate req.body
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    return res.status(400).send(msg);
  } else {
    next();
  }
};

router.post("/", isLoggedIn, validateReview, async (req, res) => {
  console.log(req.body); // Log the request body to check the data

  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).send("Listing not found");
    }

    const newReview = new Reviews({
      rating: req.body.rating,
      comment: req.body.comment,
    });

    newReview.author = req.user._id;
    console.log(newReview);

    await newReview.save();

    listing.reviews.push(newReview._id);
    await listing.save();

    req.flash("success", "Review created successfully");

    res.redirect(`/listings/${req.params.id}`);
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).send("Error creating review");
  }
});

// Delete a review for a listing
router.delete("/:reviewId", async (req, res) => {
  const { id, reviewId } = req.params;
  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Reviews.findByIdAndDelete(reviewId);
  req.flash("success", "Review deleted successfully");
  res.redirect(`/listings/${id}`);
});

module.exports = router;
