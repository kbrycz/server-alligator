// Gets the models all set up
require('./models/User')
require('./models/Game')


// import all necessary dependencies
const express = require('express')
const mongoose = require('mongoose')

// import all of the api routes
const authRoutes = require('./routes/authRoutes')
const gameRoutes = require('./routes/gameRoutes')

// Set up app object to use express library
const app = express()
const http = require('http').Server(app);
const io = require('socket.io')(http, {
    pingInterval: 10000,
    pingTimeout: (1000 * 60) * 60,
    cookie: false,
    'reconnection': true,
    'reconnectionDelay': 500,
    'reconnectionAttempts': 10
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
app.use(gameRoutes)

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
let socketRooms = new Object()

// Get list of words
let words = []
var fs = require('fs');
tempWords = fs.readFileSync('words.txt').toString().split("\n");
for (word in tempWords) {
    words.push(tempWords[word].replace("\r", ""))
}

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
                rooms[roomName]= new Object()
                rooms[roomName].hostId = socket.id
                console.log(rooms[roomName].hostId)
                rooms[roomName].isStarted = false
                rooms[roomName].numPlayers = 1
                socket.join(roomName)
                socketRooms[socket.id] = roomName
                console.log('created room: ' + roomName);
                io.in(roomName).emit('createRoom', roomName);
            }
        }
    });

    socket.on('isRoomAvailable', (obj) => {
        if (obj.code in rooms) {
            // Check if room has already started
            if (rooms[obj.code].isStarted) {
                console.log("Room has already started: " + obj.code)
                return socket.emit('roomNotFound', 2)
            }
            // Check if room is full
            const MAX_USERS = 11
            console.log(rooms[obj.code].numPlayers)
            if (rooms[obj.code].numPlayers >= MAX_USERS) {
                console.log("Room is full: " + obj.code)
                return socket.emit('roomNotFound', 1)
            }
            // Allow user to join room
            console.log("Room found with code " + obj.code)
            socket.join(obj.code)
            socketRooms[socket.id] = obj.code
            rooms[obj.code].numPlayers += 1
            io.to(rooms[obj.code].hostId).emit('hostAddPlayer', obj);
        } else {
            console.log("No room found with code " + obj.code)
            socket.emit('roomNotFound', 0)
        }     
    })

    socket.on('hostSendPlayersArray', (obj) => {
        console.log("Got obj from host. Updating array for everyone")
        io.to(obj.code).emit('updatePlayersArray', obj.players)
    })

    // -----------------Leaving The Game-----------------
    // If player clicks the leaving game button
    socket.on('leavingGame', () => {
        console.log("Player clicked the leaving game button. Disconnecting their socket")
        socket.disconnect()
    })

    // Player has disconnected from the game
    socket.on('disconnect', () => {
        console.log("user has disconnected")
        const code = socketRooms[socket.id]
        if (!code || !code in rooms) {
            return
        }

        // Host is the one who disconnected
        if (rooms[code].hostId === socket.id) {
            console.log("Host is ending the game")
            rooms[code].numPlayers -= 1

            socket.to(code).emit("hostEndedGame")
            delete socketRooms[socket.id]
            if (rooms[code].hasOwnProperty('numPlayers') && rooms[code].numPlayers < 1) {
                console.log("deleting room")
                delete rooms[code]
            }
        } 
        // Normal player disconnected
        else {
            console.log("A normal player has disconnected from the game")
            rooms[code].numPlayers -= 1

            socket.to(code).emit("playerLeftLobby", socket.id)
            delete socketRooms[socket.id]
            if (rooms[code].hasOwnProperty('numPlayers') && rooms[code].numPlayers < 1) {
                console.log("deleting room")
                delete rooms[code]
            }
        }
    })

       // -----------------Playing The Game-----------------
    socket.on('startGame', (code) => {
        console.log("Host is starting the game")
        let wordNum = Math.floor(Math.random() * words.length);
        let word = words[wordNum]
        rooms[code].isStarted = true
        io.in(code).emit("hostStartedGame", word)
    })
    socket.on('startTimer', (code) => {
        console.log("Host is setting the timer for everyone")
        setTimeout(() => {
            io.in(code).emit("timerDone")
        }, 10000)
        
    })
})


// HELPER FUNCTIONS

function deleteByValue(val) {
    for (let s in socketRooms) {
        if (socketRooms.hasOwnProperty(s) && socketRooms[s] === val) {
            delete socketRooms[s];
        }
    }
}


http.listen(3000, () => console.log('listening on port 3000'));