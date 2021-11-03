const mongoose = require('mongoose')

const gameSchema = new mongoose.Schema({
    players: {
        type: Array,
        required: true
    },
    code: {
        type: String,
        required: true,
        index: {unique: true, dropDups: true}
    },
    createdAt: { type: Date, expires: '3000m', default: Date.now }
})
mongoose.model('Game', gameSchema)