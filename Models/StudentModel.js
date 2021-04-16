const mongoose = require('mongoose')

const StudentModel = new mongoose.Schema({
    name: {
        type: String,
        unique: [true, 'name is already exist'],
        required: [true, 'Why no name?']
    },
    class: {
        type: String,
        required: [true, 'class required']
    },
    branch: {
        type: String,
        default: 'base'
    },
}, {timestamps: true})

module.exports = mongoose.model('student', StudentModel);