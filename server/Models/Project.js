const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }],
    pendingInvites: [{
        email: String,
        invitedAt: {
            type: Date,
            default: Date.now
        }
    }],
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('project', ProjectSchema);