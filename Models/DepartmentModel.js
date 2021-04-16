const mongoose = require('mongoose')
const { Schema } = mongoose;

const DepartmentModel = new mongoose.Schema({
    departmentName: {
        type: String,
        required: [true, 'department name is required']
    }
})

module.exports = DepartmentModel;