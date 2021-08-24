// Gets the models all set up
require('./models/User')


// import all necessary dependencies
const express = require('express')
const mongoose = require('mongoose')

// import all of the api routes
const authRoutes = require('./routes/authRoutes')

// Set up app object to use express library
const app = express()
const http = require('http').Server(app);
const io = require('socket.io')(http, {
    pingInterval: 10000,
    pingTimeout: (1000 * 60) * 30,
    cookie: false
});

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

// ****************SOCKET FUNCTIONS**********************

let rooms = new Object()
io.on('connection', (socket) => {

    console.log('We have a connection!');

    // -----------------Game Creation and joining-----------------
    socket.on('createRoom', () => {
        let status = true
        let roomName = ''
        while (status) {
            roomName = (Math.floor(10000 + Math.random() * 90000)).toString()
            if (!(roomName in rooms)) {
                status = false
                rooms[roomName] = {hostSocket: socket.id}
                socket.join(roomName)
                console.log('created room: ' + roomName);
                io.in(roomName).emit('createRoom', roomName);
            }
        }
    });

    socket.on('isRoomAvailable', (obj) => {
        if (obj.code in rooms) {
            console.log("Room found with code " + obj.code)
            socket.join(obj.code)
            io.to(rooms[obj.code].hostSocket).emit('hostAddPlayer', obj);
        } else {
            console.log("No room found with code " + obj.code)
            socket.emit('roomNotFound')
        }     
    })

    socket.on('hostSendPlayersArray', (obj) => {
        console.log("Got obj from host. Updating array for everyone")
        io.to(obj.code).emit('updatePlayersArray', obj.players)
    })

    // -----------------Leaving The Game-----------------
    socket.on('hostEndingGame', (code) => {
        console.log("Host decided to leave game. Erasing game from list and notifying users")
        delete rooms[code]
        socket.to(code).emit("hostEndedGame")
    })

    socket.on('playerLeavingLobby', (obj) => {
        console.log("Player has left the lobby. Letting others know who left by id.")
        socket.to(obj.code).emit("playerLeftLobby", obj.id)
    })


})
// Starts the app to listen on port 3000
// app.listen(3000, () => {
//     console.log('Listening on port 3000')
// })

http.listen(3000, () => console.log('listening on port 3000'));