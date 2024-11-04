const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const Listing = require("./models/listing");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const {  listingSchema  } = require("./schema.js");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
}

main()
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/listings", async (req, res) => {
  const alllistings = await Listing.find();
  res.render("listings/index", { allListings: alllistings });
});

app.get("/listings/new", (req, res) => {
  res.render("listings/new.ejs");
});

app.get("/listings/:id", async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/show.ejs", { listing });
});

app.post("/listings", async (req, res, next) => {
  try {
    // Check if req.body.Listing exists
    if (!req.body.Listing) {
      const missingDataError = new Error("Request body is missing 'Listing' data");
      missingDataError.status = 400; // Bad Request
      return next(missingDataError);
    }

    // Validate incoming request body
    const { error } = listingSchema.validate(req.body.Listing);

    // If validation fails, log the error and return an error response
    if (error) {
      console.log("Validation error:", error);
      const validationError = new Error(error.details[0].message || "Invalid request body");
      validationError.details = error.details;
      validationError.status = 400; // Bad Request
      return next(validationError);
    }

    // Create the new listing object
    const newListing = new Listing({
      title: req.body.Listing.title,
      description: req.body.Listing.description,
      image: {
        filename: req.body.Listing.image.filename || "listingimage", // Default filename
        url: req.body.Listing.image.url,
      },
      price: req.body.Listing.price,
      location: req.body.Listing.location,
      country: req.body.Listing.country,
    });

    // Save the listing
    await newListing.save();

    // Log the created listing details to the console
    console.log("Listing created successfully:", newListing);

    // Redirect or send a minimal response (change "/listings" to your desired redirect path)
    res.redirect("/listings");
    // Alternatively, you could use res.status(201).send("Listing created successfully") if you don't want to redirect
  } catch (err) {
    // Pass any other errors to the error handling middleware
    next(err);
  }
});


app.get("/listings/:id/edit", async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
});

app.put("/listings/:id", async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndUpdate(id, { ...req.body.Listing });
  res.redirect("/listings");
});

app.delete("/listings/:id", async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndDelete(id);
  console.log(listing);
  res.redirect("/listings");
});

app.use((err, req, res, next) => {
  res.send(err.message);
  console.log(err.message);
});

app.listen(8080, () => {
  console.log("Server listening on port 8080");
});
