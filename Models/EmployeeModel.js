const mongoose = require('mongoose')
const DepartmentModel = require('./DepartmentModel')
const GradeModel = require('./GradeModel')


const EmployeeModel = new mongoose.Schema({
    name: {
        type: String,
        unique: [true, 'name is already exist'],
        required: [true, 'name is required']
    },
    department: DepartmentModel,
    grade: [GradeModel],
    salary: {
        type: Number,
        required: [true, 'salary is required']
    },
})

module.exports = mongoose.model('employee', EmployeeModel);