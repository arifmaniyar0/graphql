const express = require('express')
const https = require('https');
var { graphql, buildSchema } = require('graphql');
var { graphqlHTTP } = require('express-graphql');
// const mongoose = require('mongoose')
const axios = require('axios')
const PaytmChecksum = require('paytmchecksum')
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
type Department {
  _id: ID
  departmentName: String
}

type Grade {
  _id: ID
  grade: String
  year: String 
}

type Employee {
  _id: ID!
  name: String
  salary: String
  department: Department
  grade: [Grade]
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
  Employees: [Employee]
  TotalEmployees: Int!
  EmployeeByName(name: String!): [Employee]
  UserByID(_id: ID!): User
  GetAllUsers: [User]
}
`);


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
  },
  Employees: async () => {
    let employees = await Employees.find();
    return employees;
  },
  TotalEmployees: async () => {
    let total = await Employees.find().count();
    return total;
  },
  EmployeeByName: async (name) => {
    let employee = await Employees.find({ name: { $regex: `.*${name}*.` } })
    return employee;
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
// Student.watch().on('error', data => console.log('error', data))

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
  }).sort({ name: 1 })
  res.send(result)
})


app.post('/offer', async (req, res) => {
  try{
  var paytmParams = {};

  paytmParams.body = {
      "mid"  : "iivZhi52118678221533"
  };

/*
* Generate checksum by parameters we have in body
* Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys 
*/
PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), "fQIjFPO9s3TlyzM#").then(function(checksum){

    paytmParams.head = {      
        "channelId" : "WEB",
        "tokenType" : "CHECKSUM",
        "token"     : checksum
    };

    var post_data = JSON.stringify(paytmParams);

    var options = {

        /* for Staging */
        hostname: 'securegw-stage.paytm.in',
        // hostname: 'securegw-stage.paytm.in',

        /* for Production */
        // hostname: 'securegw.paytm.in',

        port: 443,
        path    : '/theia/api/v1/fetchAllPaymentOffers?mid=iivZhi52118678221533',
        method  : 'POST',
        headers : {
            'Content-Type'  : 'application/json',
            'Content-Length': post_data.length
        }
    };

    var response = "";
    var post_req = https.request(options, function(post_res) {
        post_res.on('data', function (chunk) {
            response += chunk;
        });

        post_res.on('end', function(){
            console.log('Response: ', response);
        });
    });
    post_req.write(post_data);
    post_req.end();
});
  }
  catch(err) {
    console.log(err.message)
  }
res.end();
})

app.post('/balance', (req, res) => {
  try {
    var paytmParams = {};

paytmParams.body = {
    "paymentMode" : "BALANCE",
};

paytmParams.head = {
    "txnToken"    : "f0bed899539742309eebd8XXXX7edcf61588842333227"
};

var post_data = JSON.stringify(paytmParams);

var options = {

    /* for Staging */
    hostname: 'securegw-stage.paytm.in',

    /* for Production */
    // hostname: 'securegw.paytm.in',

    port: 443,
    path: '/userAsset/fetchBalanceInfo?mid=YOUR_MID_HERE&orderId=ORDER_123456',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': post_data.length
    }
};

var response = "";
var post_req = https.request(options, function(post_res) {
    post_res.on('data', function (chunk) {
        response += chunk;
    });

    post_res.on('end', function(){
        console.log('Response: ', response);
    });
});

post_req.write(post_data);
post_req.end();      
  }
  catch(err) {
    console.log('err', err.message)
  }
  res.end();
})

app.post('/init', (req, res) => {
  try{
    var paytmParams = {};

    paytmParams.body = {
        "requestType"   : "Payment",
        "mid"           : "iivZhi52118678221533",
        "websiteName"   : "WEBSTAGING",
        "orderId"       : "ORDERID_98765",
        "callbackUrl"   : "http://localhost:3000/callback",
        "txnAmount"     : {
            "value"     : "1.00",
            "currency"  : "INR",
        },
        "userInfo"      : {
            "custId"    : "CUST_001",
        },
    };
    
    /*
    * Generate checksum by parameters we have in body
    * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys 
    */
    PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), "fQIjFPO9s3TlyzM").then(function(checksum){
    
        paytmParams.head = {
            "signature"    : checksum
        };
    
        var post_data = JSON.stringify(paytmParams);
    
        var options = {
    
            /* for Staging */
            hostname: 'securegw-stage.paytm.in',
    
            /* for Production */
            // hostname: 'securegw.paytm.in',
    
            port: 443,
            path: '/theia/api/v1/initiateTransaction?mid=iivZhi52118678221533&orderId=ORDERID_98765',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': post_data.length
            }
        };
    
        var response = "";
        var post_req = https.request(options, function(post_res) {
            post_res.on('data', function (chunk) {
                response += chunk;
            });
    
            post_res.on('end', function(){
                console.log('Response: ', response);
            });
        });
    
        post_req.write(post_data);
        post_req.end();
    })
    .catch(err => {
      console.log('errr', err)
      res.json(err)
    })
  }
  catch(err) {
    console.log('err', err.message)
    res.end();
  }
  // res.end();
})

app.listen(5000, () => {
    console.log('running at port 3000')
})

// app.get('/callback', (req, res) => {
//   console.log('params',req.params)
//   console.log('query',req.query)
//   res.end()
// })

app.get('/test1', async (req, res) => {
  
  let employee = await Employees.aggregate([
    {
      $match: {}
    },
    {
      $project : {
        _id: 0,
        name: 1,
        salary: 1,
        department: '$department.departmentName',
        grade: '$grade.grade'
      }
    }
  ])
  res.send(employee)
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

