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
        Game.findOne({code: code}, (err, game) => {
            let tempPlayers = game.players
            for (let i = 0; i < game.players.length; ++i) {
                if (game.players[i].id === id) {
                    tempPlayers[i].answers = answers
                    break
                }
            }
            game.players = tempPlayers
            game.save(() => {
                console.log("Players obj successfully updated")
                res.send({players: tempPlayers})
            })
        })
    }
    catch (err) {
        return res.status(422).send({error: err.message})
    }
})

module.exports = router