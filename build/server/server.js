"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require('path');
var express = require('express');
var synapse = require('./synapse/synapse');
var app = express();
var PORT = 3000;
app.use(express.json());
app.use('/api', synapse(path.resolve(__dirname, './resources')));
app.get('/', function (req, res) {
    res.send('hello world');
});
app.use(function (err, req, res, next) { return res.status(err.status).send(err.serialize()); });
app.listen(PORT, function () { return console.log("listening on port " + PORT); });
module.exports = app;
