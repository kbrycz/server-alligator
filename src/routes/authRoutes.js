const express = require('express')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const User = mongoose.model('User')


const router = express.Router()

// Creates a user in the mongodb database and returns token to user 
router.post('/signup', async (req, res) => {
    const {username, password, first, last} = req.body

    if (!username || !password || !first || !last) {
        res.status(422).send({error: 'Must fill out all fields'})
    }
    try {
        const user = new User({username, password, first, last})
        await user.save()
        const token = jwt.sign({userId: user._id}, 'MY_SECRET_KEY')
        console.log("user signed up")
        res.send({token})
    }
    catch (err) {
        return res.status(422).send({error: err.message})
    }
})

// Checks if user has correct credentials and returns token for login
router.post('/signin', async (req, res) => {
    const {username, password} = req.body
    
    if (!username || !password) {
        res.status(422).send({error: 'Must provide email and password'})
    }

    const user = await User.findOne({username})
    if (!user) {
        return res.status(422).send({error: 'Invalid email or password'})
    }
    try {
        await user.comparePassword(password)
        const token = jwt.sign({userId: user._id}, 'MY_SECRET_KEY')
        console.log("user signed in")
        res.send({token})
    }
    catch (err) {
        return res.status(422).send({error: 'Invalid email or password'})
    }
})

module.exports = router