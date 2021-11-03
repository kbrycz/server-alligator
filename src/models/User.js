const mongoose = require('mongoose')
const bcrypt = require('bcrypt-nodejs')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        index: {unique: true, dropDups: true},
        required: true
    },
    password: {
        type: String,
        required: true
    },
    first: {
        type: String,
        required: true
    },
    last: {
        type: String,
        required: true
    },
})

// Makes sure that the user's password is hashed before entering db
userSchema.pre('save', function(next) {
    const user = this
    if (!user.isModified('password')) {
        return next()
    }

    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            return next(err)
        }
        bcrypt.hash(user.password, salt, null, (err, hash) => {
            if (err) {
                return next(err)
            }
            user.password = hash
            next()
        })
    })
})

userSchema.methods.comparePassword = function(candidatePassword) {
    const user = this
    return new Promise((resolve, reject) => {
        bcrypt.compare(candidatePassword, user.password, (err, isMatch) => {
            if (err) {
                return reject(err)
            }

            if (!isMatch) {
                return reject(false)
            }

            resolve(true)
        })
    })
}

mongoose.model('User', userSchema)