const express = require('express')
const mongoose = require('mongoose')
const Game = mongoose.model('Game')


const router = express.Router()

// Creates a user in the mongodb database and returns token to user 
router.post('/createGame', async (req, res) => {
    const {players, code} = req.body

    if (!players || !code ) {
        res.status(422).send({error: 'Host did not send enough data'})
    }
    try {
        const game = new Game({players, code})
        await game.save()
        console.log("Game object created successfully in db")
        res.send("Success")
    }
    catch (err) {
        return res.status(422).send({error: err.message})
    }
})

// Creates a user in the mongodb database and returns token to user 
router.post('/submitAnswers', async (req, res) => {
    const {answers, code, id} = req.body

    if (!answers || !code || !id ) {
        res.status(422).send({error: 'Player did not send enough data'})
        return
    }
    try {

        // Finds the game to get the players array
        Game.findOne({code: code}, async (err, game) => {
            if (!game) {
                console.log("Game has been deleted")
                return res.status(422).send({error: "Game has been deleted"})
            }
            let tempPlayers = game.players.slice()
            for (let i = 0; i < game.players.length; ++i) {
                if (game.players[i].id === id) {
                    tempPlayers[i].answers = answers.slice()
                    break
                }
            }
            // updates the game players array to new array
            try {
                await Game.updateOne({code: code}, {players: tempPlayers})
                res.send({players: tempPlayers})
            }
            catch (err2) {
                console.log(err2)
                return res.status(422).send({error: err2.message})
            }
        })

        
    }
    catch (err) {
        return res.status(422).send({error: err.message})
    }
})

// Gets other player data for the end of game lobby
router.get('/otherPlayersData', async (req, res) => {
    const {code} = req.query

    if (!code) {
        res.status(422).send({error: 'Did not receive game code from user'})
        return
    }
    try {
        Game.findOne({code: code}, (err, game) => {
            if (!game) {
                console.log("Game has been deleted")
                return res.status(422).send({error: "Game has been deleted"})
            }
            console.log("sending players array to all players")
            res.send({players: game.players})
        })
    }
    catch (err) {
        return res.status(422).send({error: err.message})
    }
})

module.exports = router