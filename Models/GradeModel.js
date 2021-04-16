const mongoose = require('mongoose')
const { Schema } = mongoose;


const GradeModel = new mongoose.Schema({
    year: {
        type: String,
        required: [true, 'year is required']
    },
    grade: {
        type: String,
        required: [true, 'grade is required']
    },
    
})

module.exports = GradeModel;