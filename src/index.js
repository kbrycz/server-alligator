// Gets the models all set up
require('./models/User')

// import all necessary dependencies
const express = require('express')
const mongoose = require('mongoose')

// import all of the api routes
const authRoutes = require('./routes/authRoutes')

// Set up app object to use express library
const app = express()

// Basic api settings
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// For profile picture uploads
app.use(express.static('uploads'))
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '15MB' }));

// Get all of the routes set up
app.use(authRoutes)

// Get mongodb all set up with mongoose
const mongoUri = 'mongodb+srv://admin:pass@cluster0.qp5yn.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'
mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
})

// If mongoose connection works
mongoose.connection.on('connected', () => {
    console.log('Connected to mongo instance')
})

// If unable to connect to mongoose
mongoose.connection.on('error', (err) => {
    console.log('Error connecting to mongo: ' + err)
})

// Starts the app to listen on port 3000
app.listen(3000, () => {
    console.log('Listening on port 3000')
})