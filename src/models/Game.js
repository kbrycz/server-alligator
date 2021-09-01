const mongoose = require('mongoose')

const gameSchema = new mongoose.Schema({
    players: {
        type: Array,
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
})

mongoose.model('Game', gameSchema)