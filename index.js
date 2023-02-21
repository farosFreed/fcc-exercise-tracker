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
  _id: Number,
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
  _id: Number,
});
const Exercise = mongoose.model("exerciseSchema", exerciseSchema);
// LOG
let logSchema = new mongoose.Schema({
  _id: Number,
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
// app.use("/api/users", bodyParser.urlencoded({ extended: false }));

// Create a new user
app.post("/api/users", async (req, res) => {
  // check for duplicate
  console.log(req.body.username);
  const foundDoc = await User.findOne({ username: req.body.username });
  console.log(foundDoc);
  if (!foundDoc) {
    console.log("attempt user create");
    const result = await User.create({ username: req.body.username });
    console.log(result);
    res.json({
      username: result.username,
      _id: result._id,
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
  const foundUsers = await User.find({}, "_id username");
  console.log(foundUsers);
  res.json(foundUsers);
});

// You can POST to /api/users/:_id/exercises with form data description,
// duration, and optionally date. If no date is supplied, the current date will be used.

app.post("/api/users/:_id/exercises", async (req, res) => {
  // const foundDoc = await Exercise.findById(eq.params._id);
  // console.log(foundDoc);
  // if (!foundDoc) {
  // console.log("error");
  // } else {

  // get id
  const userResult = User.findById(req.params._id);
  console.log(userResult);
  let newExercise;

  if (!userResult) {
    console.log("error");
  } else {
    console.log("attempt exercise create");
    const currentUserid = req.params._id;
    newExercise = {
      _id: currentUserid,
      username: userResult.username,
      description: req.body.description,
      duration: parseInt(req.body.duration),
      date: req.body.date
        ? new Date(req.body.date).toDateString()
        : new Date().toDateString(),
    };
    const result = await Exercise.create(newExercise);
    console.log(result);
  }

  const userLog = Log.findById(req.params._id);
  console.log(userLog);
  let newUserLog;
  // if no log
  if (!userLog) {
    // create
    newUserLog = {
      _id: req.params._id,
      username: userResult.username,
      count: 1,
      log: [
        {
          description: req.body.description,
          duration: newExercise.duration,
          date: newExercise.date,
        },
      ],
    };
    const newLog = Log.create(newUserLog);
    console.log(newLog);
    // TODO response
  } else {
    // update
    const updatedLog = Log.updateOne(
      { _id: req.params._id },
      {
        $push: {
          log: {
            description: req.body.description,
            duration: newExercise.duration,
            date: newExercise.date,
          },
        },
        $inc: { count: 1 },
      },
      function (err, docs) {
        if (err) {
          console.log(err);
        }
        console.log(docs);
      }
    );
    console.log(updatedLog);
  }

  // TODO if failing, maybe return user LOG object instead?
  res.json({
    username: result.username,
    _id: result._id,
    description: result.description,
    duration: result.duration,
    date: result.date,
  });
  // }
});

// You can make a GET request to /api/users/:_id/logs to retrieve a full exercise log of any user.
// You can add from, to and limit parameters to a GET /api/users/:_id/logs request to retrieve part of the log of any user. from and to are dates in yyyy-mm-dd format. limit is an integer of how many logs to send back.
app.get("/api/users/:_id/logs", async (req, res) => {
  // use id to get user log
  const foundLog = Log.findOne({ _id: req.params._id });
  res.json(foundLog);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
