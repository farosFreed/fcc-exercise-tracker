require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
// enable body parsing
const bodyParser = require("body-parser");

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
  username: { type: String, unique: true, required: true },
});
const User = mongoose.model("exerciseUser", userSchema);
// EXERCISE
let exerciseSchema = new mongoose.Schema({
  // username: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, min: 1, required: true },
  date: { type: Date, default: Date.now },
  userId: { type: String, required: true },
});
const Exercise = mongoose.model("exercise", exerciseSchema);

app.use(cors());

// body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Create a new user
app.post("/api/users", async (req, res) => {
  // check for duplicate
  const foundDoc = await User.findOne({ username: req.body.username });
  console.log(foundDoc);
  if (!foundDoc) {
    console.log("attempt user create");
    // if no dupe, create
    const newUser = new User({
      username: req.body.username,
    });
    await newUser.save();

    res.json({
      username: newUser.username,
      _id: newUser._id,
    });
  } else {
    // DUPLICATE!
    console.log("duplicate");
    // TODO if failing remove dupe check?
    res.json({
      username: foundDoc.username,
      _id: foundDoc._id,
    });
  }
});

// Get all users
app.get("/api/users", async (req, res) => {
  // get list of users
  const foundUsers = await User.find({}, "username _id");
  // or .select({_id: 1, username: 1})
  res.json(foundUsers);
});

// You can POST to /api/users/:_id/exercises with form data description,
// duration, and optionally date. If no date is supplied, the current date will be used.
app.post("/api/users/:_id/exercises", async (req, res) => {
  // get id
  const userResult = await User.findById(req.params._id);
  console.log("user result " + userResult);

  if (!userResult) {
    return res.json({ error: "error, no user with that id" });
  }
  let newExercise = new Exercise({
    userId: req.params._id,
    username: userResult.username,
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: req.body.date ? new Date(req.body.date) : new Date(),
  });
  await newExercise.save();
  res.json({
    username: userResult.username,
    _id: newExercise.userId,
    description: newExercise.description,
    duration: newExercise.duration,
    date: newExercise.date.toDateString(),
  });
});

// You can make a GET request to /api/users/:_id/logs to retrieve a full exercise log of any user.
// You can add from, to and limit parameters to a GET /api/users/:_id/logs request to retrieve part of the log of any user. from and to are dates in yyyy-mm-dd format. limit is an integer of how many logs to send back.
app.get("/api/users/:_id/logs", async (req, res) => {
  // use id to get user log
  const id = req.params._id;
  const foundUser = await User.findById(id);
  let { from, to, limit } = req.query;

  if (!foundUser) {
    return res.json({ error: "user not found" });
  }

  // set filter
  let filter = { userId: id };
  if (from && to) {
    from = new Date(from);
    to = new Date(to);
    if (
      from.toString() === "Invalid Date" ||
      to.toString() === "Invalid Date"
    ) {
      res.json({ error: "Invalid Date Format for To or From!" });
    }
    filter = { userId: id, date: { $gte: from, $lte: to } };
  } else if (from) {
    from = new Date(from);
    if (from.toString() === "Invalid Date")
      return res.json({ error: "Invalid Date Format for From!" });
    filter = { userId: id, date: { $gte: from } };
  } else if (to) {
    to = new Date(to);
    if (to.toString() === "Invalid Date")
      return res.json({ error: "Invalid Date Format for To!" });
    filter = { userId: id, date: { $lte: to } };
  }

  // set limit
  if (limit) {
    limit = parseInt(limit);
    if (isNaN(limit)) return res.json({ error: "Limit must be a number!" });
  } else {
    limit = 0;
  }

  // search
  let foundExercises = await Exercise.find(filter).limit(limit);
  // reformat data for response
  foundExercises = foundExercises.map((exercise) => {
    return {
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
    };
  });
  res.json({
    username: foundUser.username,
    count: foundExercises.length,
    _id: foundUser._id,
    log: foundExercises,
  });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
