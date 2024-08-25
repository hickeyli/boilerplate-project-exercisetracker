const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid'); // To generate unique IDs
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// In-memory storage for users and exercises
const users = [];
const exercises = [];

// POST /api/users - Create a new user
app.post('/api/users', (req, res) => {
  const username = req.body.username;
  const userId = uuidv4();

  const newUser = { username, _id: userId };
  users.push(newUser);
  res.json(newUser);
});

// GET /api/users - Get the list of all users
app.get('/api/users', (req, res) => {
  res.json(users);
});

// POST /api/users/:_id/exercises - Add an exercise to a user
app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  const user = users.find(u => u._id === userId);

  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }

  const { description, duration, date } = req.body;
  const exerciseDate = date ? new Date(date) : new Date();

  if (isNaN(exerciseDate.getTime())) {
    return res.status(400).json({ error: 'Invalid date' });
  }

  const exercise = {
    username: user.username,
    description: description,
    duration: parseInt(duration),
    date: exerciseDate.toDateString(),
    _id: user._id
  };

  exercises.push({
    userId: user._id,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date
  });

  // Return the user object with the exercise fields added
  res.json({
    _id: user._id,
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date
  });
});

// GET /api/users/:_id/logs - Retrieve a user's exercise log
app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;
  const user = users.find(u => u._id === userId);

  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }

  const { from, to, limit } = req.query;

  let userExercises = exercises
    .filter(ex => ex.userId === userId)
    .map(ex => ({
      description: ex.description,
      duration: ex.duration,
      date: ex.date
    }));

  if (from) {
    const fromDate = new Date(from);
    userExercises = userExercises.filter(ex => new Date(ex.date) >= fromDate);
  }
  if (to) {
    const toDate = new Date(to);
    userExercises = userExercises.filter(ex => new Date(ex.date) <= toDate);
  }

  if (limit) {
    userExercises = userExercises.slice(0, parseInt(limit));
  }

  res.json({
    username: user.username,
    count: userExercises.length,
    _id: user._id,
    log: userExercises
  });
});




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
