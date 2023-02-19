require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
// enable body parsing
const bodyParser = require("body-parser");
// enable dns lookup
const dns = require("dns");
const url = require("url");

// Basic Configuration
const port = process.env.PORT || 3000;

// setup mongoose
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
// setup mongoose scheme
// USER
let userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
});
const User = mongoose.model("userSchema", userSchema);
// EXERCISE
let exerciseSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  description: String,
  duration: Number,
  date: String,
});
const Exercise = mongoose.model("exerciseSchema", exerciseSchema);
// LOG
let logSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  count: Number,
  log: [
    {
      description: String,
      duration: Number,
      date: String,
    },
  ],
});
const Log = mongoose.model("logSchema", logSchema);

app.use(cors());

// body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/api/shorturl", bodyParser.urlencoded({ extended: false }));

// Your first API endpoint
app.post("/api/shorturl", (req, res) => {
  async () => {
    // check for duplicate
    const foundDoc = await User.findOne({ username: req.body.username });
    if (!foundDoc) {
      const result = await User.create({ username: req.body.username });
      res.json({
        username: result.username,
        _id: result._id,
      });
    } else {
      // DUPLICATE!
      console.log("duplicate");
      // TODO if failing remove dupe check?
      res.json({
        original_url: foundDoc.username,
        short_url: foundDoc._id,
      });
    }
  };
});

// Get all users
app.get("/api/users", async (req, res) => {
  // get list of users
  const foundUsers = await User.find({});
  console.log(foundUsers);
  res.json(foundUsers);
});

/* app.get("/api/shorturl/:index", async (req, res) => {
  const index = req.params.index * 1;
  const foundDoc = await Url.findOne({ short_url: index });
  if (!foundDoc) {
    res.json({ error: "invalid url" });
  } else {
    res.redirect(foundDoc.original_url);
  }
}); */

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
