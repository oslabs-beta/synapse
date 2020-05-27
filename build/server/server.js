"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require('path');
<<<<<<< HEAD
=======
var mongoose = require('mongoose');
>>>>>>> b826f753624daf4a092b077e7ad97ba5faff2041
var express = require('express');
var synapse = require('./synapse/synapse');
var app = express();
var PORT = 3000;
<<<<<<< HEAD
=======
var mongoURI = 'mongodb+srv://denskarlet:DS090295170837@cluster0-cwr1z.mongodb.net/test?retryWrites=true&w=majority';
mongoose
    .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'SOLODB',
})
    .then(function () { return console.log('Connected to Mongo DB.'); })
    .catch(function (err) { return console.log(err); });
>>>>>>> b826f753624daf4a092b077e7ad97ba5faff2041
app.use(express.json());
app.use('/api', synapse(path.resolve(__dirname, './resources')));
app.get('/', function (req, res) {
    res.send('hello world');
});
app.use(function (err, req, res, next) { return res.status(err.status).send(err.serialize()); });
app.listen(PORT, function () { return console.log("listening on port " + PORT); });
module.exports = app;
