const express = require('express')
var { graphql, buildSchema } = require('graphql');
var { graphqlHTTP } = require('express-graphql');
// const mongoose = require('mongoose')

const Student = require('./Models/StudentModel')
const Employees = require('./Models/EmployeeModel')

const conn = require('./Database/db')

const app = express();

app.use(express.json())

var schema = buildSchema(`
type User {
  _id: ID!
  branch: String
  name: String
  class: String
  updatedAt: String
  createdAt: String
}

input UserInput {
  branch: String
  name: String
  class: String
}

type Mutation {
  createUser(input: UserInput): User
  updateUser(_id: ID!, input: UserInput): String
}

type Query {
  UserByID(_id: ID!): User
  GetAllUsers: [User]
}
`);




var db = {}

var root = {
  GetAllUsers: async () => {
    var students = await Student.find({});
    return students;
  },
  UserByID: async ({ _id }) => {
    var student = await Student.findById({ _id })
    return student;
  },
  createUser: async ({input}) => {
    var student = new Student(input);
    student.save();
    return student;
  },
  updateUser: async ({_id, input}) => {
    var student = await Student.updateOne({ _id }, input)
    return student
  }
};


const auth = (req, res, next) => {
  const { token } = req.headers;
  if(!token) {
    return res.status(401).send({status: 'Failed', message: 'Authentication Failed'})
  }

  let tkn = token.split(' ');
  if(tkn[0] != 'bearer' || tkn[1] !== "123456") {
      return res.status(401).send({status: 'Failed', message: 'Authentication Failed'})
  }

  next();

  
}

Student.watch().on('change', data => console.log('change stream', data))
Student.watch().on('error', data => console.log('error', data))

app.use('/', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
}));

app.get('/', auth, async (req, res) => {
  console.log(req.headers.xkey)
  var result = 'something went wrong!';
  try {
    result = await Employees.aggregate([
      {
        $match: { salary: { $gt: 0 } }
      },
      {
        // $group : {
        //   _id: '$salary',
        //   total: { $sum: 1 }
        // }
        $lookup: {
          from : 'students',
          localField: 'name',
          foreignField: 'name',
          as: 'data'
        }
      },
      {
        $project:{ _id: 0, name: 1},
      },
      {
        $sort: {
          name: 1
        }
      }
    ])
  }
  catch(error) {
    result = error.message;
  }
  res.send(result)
})

app.post('/', async (req, res) => {
  // var result = await Employees.find({}).select({ _id: 0, 'department.departmentName': 1, salary: 1 })
  var result = await Employees.aggregate([
    {
      $project: {
        _id: 0,
        name: 1,
        salary: 1,
        'departmentName': 'department.departmentName',
        'grade.grade': 1,
        'grade.year': 1,
      }
    },
    {
      $sort: {
        name: 1
      }
    }
  ])
  res.send(result)
})

app.post('/test', async (req, res) => {
  var result = await Employees.find().select({
    _id: 0,
    name: 1,
    salary: 1,
    'grade.grade': 1,
    'grade.year': 1,
    'departmentName': '$department.departmentName',
  })
  res.send(result)
})

app.listen(3000, () => {
    console.log('running at port 3000')
})


// var employee = new Employees({
//   name: 'Irfan',
//   salary: 30000,
//   department: {
//     departmentName: 'Electrical'
//   },
//   grade: [
//     {
//       year: '2015',
//       grade: 'A'
//     },
//     {
//       year: '2016',
//       grade: 'B'
//     },
//     {
//       year: '2017',
//       grade: 'A'
//     },
//     {
//       year: '2018',
//       grade: 'B'
//     }
//   ]
// })
// result = await employee.save();

