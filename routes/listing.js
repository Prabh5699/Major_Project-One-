// routes/listing.js

const express = require("express");
const router = express.Router();
const Listing = require("../models/listing");
const { isLoggedIn } = require("../middleware");
const { isOwner } = require("../middleware");

// Import review routes
const reviewRoutes = require("./review");
const { listingSchema } = require("../schema");
// const listingController = require("../controllers/listings");

//require multer
const multer = require("multer");
const { storage } = require("../cloudConfig");
const upload = multer({ storage });

//Map box
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// Home Page
router.get("/", async (req, res) => {
  const alllistings = await Listing.find();
  res.render("listings/index", { allListings: alllistings });
});

//Showing a new listing
router.get("/new", isLoggedIn, (req, res) => {
  console.log(req.user);

  res.render("listings/new.ejs");
});

// Show a specific listing

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }
  console.log(listing);
  res.render("listings/show.ejs", { listing });
});

// Create a new listing

router.post(
  "/",
  isLoggedIn,
  upload.single("Listing[image]"), // Middleware for handling single file upload with the field name "Listing[image]"
  async (req, res, next) => {
    let response = await geocodingClient
      .forwardGeocode({
        query: req.body.Listing.location,
        limit: 1,
      })
      .send();

    try {
      // Check if the request body contains the 'Listing' data
      if (!req.body.Listing) {
        const missingDataError = new Error(
          "Request body is missing 'Listing' data"
        );
        missingDataError.status = 400;
        return next(missingDataError); // Pass the error to the error handler
      }

      // Validate the Listing data in the request body using Joi schema
      const { error } = listingSchema.validate(req.body.Listing);
      if (error) {
        const validationError = new Error(
          error.details[0].message || "Invalid request body"
        );
        validationError.details = error.details;
        validationError.status = 400;
        return next(validationError); // Pass the validation error to the error handler
      }

      // Extract file URL and filename if the file was uploaded
      let url = req.file.path;
      let fileName = req.file.filename;
      const newListing = new Listing(req.body.Listing);
      newListing.owner = req.user._id; // Assign the user as the owner of the listing
      newListing.image = { url, fileName };

      //1
      newListing.geometry = response.body.features[0].geometry;
      let savedListing = await newListing.save(); // Save the listing in the database
      console.log(savedListing);
      // Set a success message in flash and redirect to the listings page
      req.flash("success", "Listing created successfully");
      res.redirect("/listings");

      //till here main
    } catch (err) {
      next(err); // Pass any other errors to the error handler
    }
  }
);

// Edit a listing

// Edit a listing
router.get("/:id/edit", isLoggedIn, isOwner, async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }
  res.render("listings/edit.ejs", { listing });
});

// Update a listing
router.put(
  "/:id",
  isLoggedIn,
  isOwner,
  upload.single("image"),
  async (req, res) => {
    const { id } = req.params;
    let listing = await Listing.findById(id);

    // Ensure that the listing exists
    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }

    // Proceed with the update
    await Listing.findByIdAndUpdate(id, { ...req.body.Listing });
    if (typeof req.file !== "undefined") {
      let url = req.file.path;
      let fileName = req.file.filename;

      listing.image = { url, fileName };
      await listing.save();
    }
    req.flash("success", "Listing updated successfully");
    res.redirect("/listings");
  }
);

// Delete a listing
router.delete("/:id", isLoggedIn, isOwner, async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findByIdAndDelete(id);

  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  req.flash("success", "Listing deleted successfully");
  res.redirect("/listings");
});

// Use review routes as nested routes
router.use("/:id/reviews", reviewRoutes);

module.exports = router;
