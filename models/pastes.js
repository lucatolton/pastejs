const { Schema, model } = require('mongoose');

const pastesSchema = new Schema({
    userID: {
        type: String,
        required: true,
    },

    title: {
        type: String,
        required: true,
    },

    content: {
        type: String,
        required: true,
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = model('pastes', pastesSchema);