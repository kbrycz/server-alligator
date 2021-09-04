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
        res.send({token: token, id: user._id})
    }
    catch (err) {
        console.log(err.code)
        return res.send({error: err.code})
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
        res.send({token, username: user.username, first: user.first, last: user.last, id: user._id})
    }
    catch (err) {
        return res.status(422).send({error: 'Invalid email or password'})
    }
})

// changes the account info of the user and returns token to user
router.post('/changeAccountInfo', async (req, res) => {
    const {username, first, last, id} = req.body

    if (!username || !first || !last || !id) {
        res.status(422).send({error: 'Must fill out all fields'})
    }
    try {
        User.findOne({_id: id}, async (err, user) => {
            const userWithName = await User.findOne({username: username})
            if (userWithName) {
                return res.send({error: 'Username already in use'})
            }
            user.username = username
            user.first = first
            user.last - last
            user.save(() => {
                const token = jwt.sign({userId: user._id}, 'MY_SECRET_KEY')
                console.log("user updated account info")
                res.send({token})
            })
        })
    }
    catch (err) {
        return res.status(422).send({error: err.message})
    }
})

// Checks if old password is the same and then changes it to new password
router.post('/changePassword', async (req, res) => {
    const {oldPassword, newPassword, id} = req.body

    if (!oldPassword || !newPassword || !id) {
        res.status(422).send({error: 'Must fill out all fields'})
    }
    try {
        User.findOne({_id: id}, async (err, user) => {
            try {
                await user.comparePassword(oldPassword)
                user.password = newPassword
                user.save(() => {
                    const token = jwt.sign({userId: user._id}, 'MY_SECRET_KEY')
                    console.log("user updated password")
                    res.send({token})
                })
            }
            catch (err) {
                console.log("Old password was not correct")
                return res.status(422).send({error: "Old password was not correct"})
            }
        })
    }
    catch (err) {
        console.log("helloerrer")
        return res.status(422).send({error: err.message})
    }
})

module.exports = router