const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://admin:redmi123%23@cluster0.2hobu.mongodb.net/graphql?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection;
// db.on('error', console.log('connection error:'));
db.once('open', function() {
  console.log('connected')
});
module.exports = db;