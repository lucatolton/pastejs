const { Schema, model } = require('mongoose');

const pastesSchema = new Schema({
    user: {
        id: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true,
        },
    },

    title: {
        type: String,
        required: true,
    },

    content: {
        type: String,
        required: true,
    },

    visibility: {
        type: String,
        required: true,
        default: 'public',
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = model('pastes', pastesSchema);